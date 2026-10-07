import os
import json
import traceback
from datetime import datetime, timezone
from database import DatabaseManager

class IntelligenceCycle:
    def __init__(self, owner_id: str):
        if not owner_id:
            raise ValueError("owner_id is required to run the intelligence cycle.")
        self.db = DatabaseManager()
        self.owner_id = owner_id

    def _start_run(self, job_name: str, segment: str):
        data = {
            "owner_id": self.owner_id,
            "job": job_name,
            "segment": segment,
            "status": "RUNNING",
            "ran_at": datetime.now(timezone.utc).isoformat(),
            "ok": True,
            "items_found": 0,
            "items_new": 0,
            "source_failures": []
        }
        res = self.db.client.table("run_log").insert(data).execute()
        return res.data[0]['id']

    def _finish_run(self, run_id: int, status: str, items_found: int, items_new: int, source_failures: list):
        data = {
            "status": status,
            "ok": status in ["COMPLETED", "PARTIAL"],
            "items_found": items_found,
            "items_new": items_new,
            "source_failures": source_failures
        }
        self.db.client.table("run_log").update(data).eq("id", run_id).execute()

    def _record_source_failure(self, source_url: str):
        res = self.db.client.table("sources").select("id, consecutive_failures").eq("owner_id", self.owner_id).eq("base_url", source_url).execute()
        if res.data:
            sid = res.data[0]['id']
            cf = (res.data[0].get('consecutive_failures') or 0) + 1
            self.db.client.table("sources").update({"consecutive_failures": cf, "last_run_ok": False, "last_run_at": "now()"}).eq("id", sid).execute()

    def execute_morning_discovery(self):
        print("Starting Morning Discovery...")
        run_id = self._start_run("morning_discovery", "MORNING_DISCOVERY")
        status = "COMPLETED"
        failures = []
        new_opps = 0
        total_found = 0

        try:
            # Reusing Phase 2 Euraxess logic
            from extractor import EuraxessExtractor
            extractor = EuraxessExtractor()
            try:
                opportunities = extractor.fetch_and_parse()
                total_found = len(opportunities)
                for opp in opportunities:
                    res_str = self.db.store_opportunity(opp, self.owner_id)
                    if res_str == "NEW":
                        new_opps += 1
                    elif res_str.startswith("CHANGED:"):
                        # Ensure changes get counted as "items_changed" if we had that metric, 
                        # but we can also just log them in failures/warnings for now
                        failures.append({"source": "ChangeDetection", "warning": res_str})
            except Exception as e:
                failures.append({"source": "EuraxessExtractor", "error": str(e)})
                self._record_source_failure("https://euraxess.ec.europa.eu/jobs/rss")
                status = "PARTIAL"
        except Exception as global_e:
            failures.append({"source": "Global", "error": str(global_e)})
            status = "FAILED"

        self._finish_run(run_id, status, total_found, new_opps, failures)
        print(f"Morning Discovery {status}. New Opps: {new_opps}.")
        return status

    def execute_afternoon_verification(self):
        print("Starting Afternoon Verification & Enrichment...")
        run_id = self._start_run("afternoon_verification", "AFTERNOON_VERIFICATION")
        status = "COMPLETED"
        failures = []

        try:
            # 1. Update matching logic (Phase 4)
            from run_phase3_4 import run as match_run
            match_run(self.owner_id)

            # 2. Update Research Engine (Phase 5)
            from research_engine import ResearchEngine
            re = ResearchEngine(self.db, self.owner_id)
            re.process_signals()
            re.evaluate_research_leads()

        except Exception as e:
            failures.append({"source": "Enrichment", "error": str(e)})
            status = "FAILED"
            traceback.print_exc()

        self._finish_run(run_id, status, 0, 0, failures)
        print(f"Afternoon Verification {status}.")
        return status

    def execute_evening_digest(self):
        print("Starting Evening Digest...")
        run_id = self._start_run("evening_digest", "EVENING_DIGEST")
        status = "COMPLETED"
        failures = []

        try:
            today = datetime.now(timezone.utc).date().isoformat()
            
            # 1. TOP MATCHES (Phase 4)
            res_leads = self.db.client.table("research_leads").select("title").eq("owner_id", self.owner_id).gte("created_at", today).execute()
            
            # 2. NEW OPPORTUNITIES & CHANGES (Phase 2 & Phase 10 Change Detection)
            res_opps = self.db.client.table("opportunities").select("title, notes, deadline").eq("owner_id", self.owner_id).gte("last_seen", today).execute()
            
            # 3. DEADLINES & APPLICATIONS (Phase 6)
            res_apps = self.db.client.table("applications").select("title, deadline, status").eq("owner_id", self.owner_id).execute()
            res_app_tasks = self.db.client.table("application_tasks").select("task_title, due_date").eq("owner_id", self.owner_id).eq("completed", False).execute()
            res_app_history = self.db.client.table("application_status_history").select("old_status, new_status, applications(title)").eq("owner_id", self.owner_id).gte("created_at", today).execute()

            # 4. FAVOURITE UPDATES (Phase 3)
            res_fav_unis = self.db.client.table("universities").select("id, name").eq("owner_id", self.owner_id).eq("is_favourite", True).execute()
            res_fav_profs = self.db.client.table("professors").select("id, name").eq("owner_id", self.owner_id).eq("is_favourite", True).execute()
            res_fav_groups = self.db.client.table("research_groups").select("id, name").eq("owner_id", self.owner_id).eq("is_favourite", True).execute()
            
            fav_updates = []
            
            if res_fav_unis.data:
                uni_ids = [u['id'] for u in res_fav_unis.data]
                # Look for new opportunities at these universities
                uni_opps = self.db.client.table("opportunities").select("title, universities(name)").in_("university_id", uni_ids).gte("last_seen", today).execute()
                for o in uni_opps.data:
                    u_name = o['universities']['name'] if o.get('universities') else 'University'
                    fav_updates.append(f"[FAVOURITE UNIVERSITY: {u_name}] New/Updated Opportunity: {o['title']}")
                    
            if res_fav_profs.data:
                prof_ids = [p['id'] for p in res_fav_profs.data]
                # Look for new research signals for these professors
                prof_sigs = self.db.client.table("research_signals").select("title, summary, professors(name)").in_("professor_id", prof_ids).gte("created_at", today).execute()
                for s in prof_sigs.data:
                    p_name = s['professors']['name'] if s.get('professors') else 'Professor'
                    fav_updates.append(f"[FAVOURITE PROFESSOR: {p_name}] {s['title']} ({s['summary']})")
                    
            if res_fav_groups.data:
                group_ids = [g['id'] for g in res_fav_groups.data]
                # Look for updated groups
                group_ups = self.db.client.table("research_groups").select("name, notes").in_("id", group_ids).gte("updated_at", today).execute()
                for g in group_ups.data:
                    fav_updates.append(f"[FAVOURITE GROUP: {g['name']}] Info updated today.")

            # Build markdown
            md = f"# Daily Digest for {today}\n\n"
            
            if res_leads.data:
                md += "## TOP MATCHES\n"
                for l in res_leads.data[:5]: md += f"- {l['title']}\n"
                md += "\n"
                
            if res_opps.data:
                md += "## NEW OPPORTUNITIES & CHANGES\n"
                for o in res_opps.data[:10]:
                    md += f"- {o['title']}\n"
                    if o['notes'] and "[Change Detected" in o['notes']:
                        # Extract the exact change text to avoid formatting-only changes being meaningless
                        change_text = o['notes'].split('[Change Detected')[-1]
                        md += f"  - *Change Note: {change_text}*\n"
                md += "\n"

            if res_apps.data or res_app_tasks.data or res_app_history.data:
                md += "## DEADLINES & APPLICATIONS\n"
                # Upcoming Application deadlines (next 30 days)
                for a in res_apps.data:
                    if a.get('deadline') and a['deadline'] >= today:
                        md += f"- [UPCOMING] Application: {a['title']} - Deadline: {a['deadline']}\n"
                # Application Status Changes today
                for ah in res_app_history.data:
                    title = ah['applications']['title'] if ah.get('applications') else 'Unknown Application'
                    md += f"- [STATUS CHANGE] {title}: {ah['old_status']} -> {ah['new_status']}\n"
                # Overdue tasks
                for t in res_app_tasks.data:
                    if t.get('due_date') and t['due_date'] <= today:
                        md += f"- [OVERDUE TASK] {t['task_title']} (Due: {t['due_date']})\n"
                md += "\n"
                    
            if fav_updates:
                md += "## FAVOURITE UPDATES\n"
                for fu in fav_updates:
                    md += f"- {fu}\n"
                md += "\n"

            # 5. RESEARCH SIGNALS (Phase 5)
            res_sigs = self.db.client.table("research_signals").select("title").eq("owner_id", self.owner_id).gte("created_at", today).execute()
            if res_sigs.data:
                md += "## RESEARCH SIGNALS\n"
                for s in res_sigs.data[:5]: md += f"- {s['title']}\n"
                md += "\n"
                
            # 6. FUNDING / RELOCATION (Phase 9)
            res_funding = self.db.client.table("funding_intelligence").select("funding_source").eq("owner_id", self.owner_id).gte("created_at", today).execute()
            res_visa = self.db.client.table("visa_intelligence").select("country").eq("owner_id", self.owner_id).gte("created_at", today).execute()
            if res_funding.data or res_visa.data:
                md += "## FUNDING / RELOCATION\n"
                for f in res_funding.data[:5]: md += f"- Funding updated: {f.get('funding_source', 'Unknown')}\n"
                for v in res_visa.data[:5]: md += f"- Visa intelligence updated for country: {v.get('country', 'Unknown')}\n"
                md += "\n"
                
            # 7. OUTREACH (Phase 7)
            res_outreach_responses = self.db.client.table("contact_history").select("summary").eq("owner_id", self.owner_id).eq("direction", "INBOUND").gte("created_at", today).execute()
            res_followups = self.db.client.table("outreach_contacts").select("professor_id, next_follow_up_at").eq("owner_id", self.owner_id).lte("next_follow_up_at", today).execute()
            res_awaiting = self.db.client.table("outreach_contacts").select("professor_id").eq("owner_id", self.owner_id).eq("status", "CONTACTED").execute()
            if res_outreach_responses.data or res_followups.data or res_awaiting.data:
                md += "## OUTREACH\n"
                for r in res_outreach_responses.data: md += f"- [NEW RESPONSE] {r['summary']}\n"
                for f in res_followups.data: md += f"- [FOLLOW-UP DUE] Professor ID: {f['professor_id']}\n"
                for a in res_awaiting.data: md += f"- [AWAITING RESPONSE] Professor ID: {a['professor_id']}\n"
                md += "\n"
                
            # 8. DOCUMENTS (Phase 8)
            res_docs_missing = self.db.client.table("portfolio_documents").select("category, title").eq("owner_id", self.owner_id).is_("file_path", "null").execute()
            res_recs_pending = self.db.client.table("recommendation_letters").select("recommender_name, status").eq("owner_id", self.owner_id).neq("status", "RECEIVED").execute()
                
            if res_docs_missing.data or res_recs_pending.data:
                md += "## DOCUMENTS\n"
                for d in res_docs_missing.data: md += f"- [MISSING DOC] {d['title']} ({d['category']})\n"
                for r in res_recs_pending.data: md += f"- [PENDING REC] {r['recommender_name']} ({r['status']})\n"
                md += "\n"

            # Check for warnings in run_log
            res_warn = self.db.client.table("run_log").select("source_failures").eq("owner_id", self.owner_id).eq("job", "morning_discovery").eq("status", "PARTIAL").order("id", desc=True).limit(1).execute()
            if res_warn.data and res_warn.data[0].get('source_failures'):
                md += "## SOURCE / SYSTEM WARNINGS\n"
                for w in res_warn.data[0]['source_failures']:
                    if isinstance(w, dict) and "warning" in w:
                        md += f"- {w['warning']}\n"
                    else:
                        md += f"- Error: {w.get('error', str(w))}\n"
                md += "\n"

            # Check if digest exists
            existing = self.db.client.table("digests").select("id").eq("owner_id", self.owner_id).eq("day", today).execute()
            
            stats = {
                "new_opportunities": len(res_opps.data),
                "new_signals": len(res_sigs.data),
                "new_leads": len(res_leads.data)
            }
            
            if existing.data:
                self.db.client.table("digests").update({"summary_md": md, "stats": stats}).eq("id", existing.data[0]['id']).execute()
            else:
                self.db.client.table("digests").insert({
                    "owner_id": self.owner_id,
                    "day": today,
                    "summary_md": md,
                    "stats": stats
                }).execute()

        except Exception as e:
            failures.append({"source": "Digest", "error": str(e)})
            status = "FAILED"
            traceback.print_exc()

        self._finish_run(run_id, status, 0, 1 if status != "FAILED" else 0, failures)
        print(f"Evening Digest {status}.")
        return status

if __name__ == "__main__":
    import sys
    cycle = IntelligenceCycle()
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "morning":
            cycle.execute_morning_discovery()
        elif cmd == "afternoon":
            cycle.execute_afternoon_verification()
        elif cmd == "evening":
            cycle.execute_evening_digest()
        elif cmd == "all":
            cycle.execute_morning_discovery()
            cycle.execute_afternoon_verification()
            cycle.execute_evening_digest()
        else:
            print("Unknown command. Use morning, afternoon, evening, or all.")
    else:
        print("Usage: python intelligence_cycle.py [morning|afternoon|evening|all]")
