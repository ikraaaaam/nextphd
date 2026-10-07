import os
import json
from datetime import datetime, timezone, timedelta
from database import DatabaseManager
from matcher import DeterministicMatcher

class ResearchEngine:
    def __init__(self, db_manager: DatabaseManager, owner_id: str):
        self.db = db_manager
        self.owner_id = owner_id
        
        # Load profile
        res = self.db.client.table('settings').select('*').eq('owner_id', self.owner_id).execute()
        if res.data:
            self.profile = res.data[0]
        else:
            self.profile = {}
            
        self.matcher = DeterministicMatcher(self.profile)

    def process_signals(self):
        print("Processing research signals...")
        
        # 1. Project Signals (New project detected)
        projects = self.db.client.table('professor_projects').select('id, title, professor_id, updated_at, start_date').eq('owner_id', self.owner_id).execute()
        for proj in projects.data:
            # Check if this project is recent (start_date within last 18 months, or created recently)
            # For simplicity, we just create a signal for every active project if it doesn't exist
            signal_title = f"New Project Detected: {proj['title']}"
            self._upsert_signal(
                professor_id=proj.get('professor_id'),
                university_id=None,
                signal_type="NEW_PROJECT",
                title=signal_title,
                summary=f"A new research project was detected for this professor.",
                signal_date=proj.get('start_date') or proj.get('updated_at')
            )

        # 2. Topic/Publication Signals
        # We query the publications table to find genuinely recent/meaningful activity (last 18 months)
        profs = self.db.client.table('professors').select('id, name, university_id, recent_topics').eq('owner_id', self.owner_id).execute()
        
        eighteen_months_ago = (datetime.now(timezone.utc) - timedelta(days=18*30)).strftime('%Y-%m-%d')
        
        for prof in profs.data:
            pubs = self.db.client.table('publications').select('title, publication_date, topics, source_url').eq('owner_id', self.owner_id).eq('professor_id', prof['id']).gte('publication_date', eighteen_months_ago).execute()
            
            recent_relevant_pubs = []
            for pub in pubs.data:
                # Check topic overlap for each publication
                match_res = self.matcher.match_professor(pub.get('topics') or [])
                if match_res.get('fit_breakdown', {}).get('topic_overlap', 0) > 0:
                    recent_relevant_pubs.append(pub)
            
            if len(recent_relevant_pubs) >= 2:
                # Strong recent activity in target topics
                latest_date = max([p['publication_date'] for p in recent_relevant_pubs])
                pub_titles = [p['title'] for p in recent_relevant_pubs[:3]]
                signal_title = f"Recent Relevant Publications"
                self._upsert_signal(
                    professor_id=prof.get('id'),
                    university_id=prof.get('university_id'),
                    signal_type="PUBLICATION_ACTIVITY",
                    title=signal_title,
                    summary=f"Found {len(recent_relevant_pubs)} relevant publications in the last 18 months, e.g.: {', '.join(pub_titles)}",
                    signal_date=latest_date,
                    source_url=recent_relevant_pubs[0].get('source_url')
                )
        # 3. Emerging Topic Candidates
        self._evaluate_emerging_topics()
                
    def _evaluate_emerging_topics(self):
        print("Evaluating Emerging Topics...")
        
        now = datetime.now(timezone.utc)
        twelve_months_ago = now - timedelta(days=365)
        twenty_four_months_ago = now - timedelta(days=2*365)
        
        # Load all publications to calculate topic frequency over periods
        pubs = self.db.client.table('publications').select('id, openalex_id, title, publication_date, topics, source_url').eq('owner_id', self.owner_id).execute()
        
        topic_stats = {}
        for pub in pubs.data:
            pub_date_str = pub.get('publication_date')
            if not pub_date_str:
                continue
                
            try:
                pub_date = datetime.strptime(pub_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
            except ValueError:
                continue
                
            topics = pub.get('topics') or []
            
            # Count towards periods
            is_recent = twelve_months_ago <= pub_date <= now
            is_baseline = twenty_four_months_ago <= pub_date < twelve_months_ago
            
            for topic in topics:
                if not topic:
                    continue
                    
                if topic not in topic_stats:
                    topic_stats[topic] = {
                        "recent_count": 0,
                        "baseline_count": 0,
                        "recent_pubs": [],
                        "source_urls": set()
                    }
                
                if is_recent:
                    # Deduplicate publications
                    pub_id = pub.get('openalex_id')
                    if pub_id and pub_id not in [p.get('openalex_id') for p in topic_stats[topic]['recent_pubs']]:
                        topic_stats[topic]["recent_count"] += 1
                        topic_stats[topic]["recent_pubs"].append(pub)
                        if pub.get('source_url'):
                            topic_stats[topic]["source_urls"].add(pub['source_url'])
                elif is_baseline:
                    topic_stats[topic]["baseline_count"] += 1
                    
        # Evaluate rules
        min_evidence = 3
        for topic, stats in topic_stats.items():
            recent_count = stats["recent_count"]
            baseline_count = stats["baseline_count"]
            
            if recent_count >= min_evidence and recent_count > baseline_count:
                growth = (recent_count - baseline_count) / max(1, baseline_count)
                
                # Deduplicate insert/update
                existing = self.db.client.table('emerging_topics').select('id').eq('owner_id', self.owner_id).eq('topic', topic).execute()
                
                data = {
                    "owner_id": self.owner_id,
                    "topic": topic,
                    "recent_count": recent_count,
                    "baseline_count": baseline_count,
                    "observation_windows": {
                        "recent": {"start": twelve_months_ago.strftime('%Y-%m-%d'), "end": now.strftime('%Y-%m-%d')},
                        "baseline": {"start": twenty_four_months_ago.strftime('%Y-%m-%d'), "end": twelve_months_ago.strftime('%Y-%m-%d')}
                    },
                    "growth_measure": round(growth, 2),
                    "minimum_evidence_count": min_evidence,
                    "supporting_publication_ids": [p['openalex_id'] for p in stats['recent_pubs']],
                    "source_urls": list(stats['source_urls']),
                    "evidence": {
                        "type": "EMERGING_TOPIC_CANDIDATE",
                        "explanation": f"Topic '{topic}' has {recent_count} recent publications (baseline: {baseline_count})."
                    },
                    "detected_at": now.isoformat()
                }
                
                if not existing.data:
                    self.db.client.table('emerging_topics').insert(data).execute()
                    print(f"Created Emerging Topic Candidate: {topic}")
                else:
                    self.db.client.table('emerging_topics').update(data).eq('id', existing.data[0]['id']).execute()
                    print(f"Updated Emerging Topic Candidate: {topic}")

    def _upsert_signal(self, professor_id, university_id, signal_type, title, summary, signal_date, source_url=None):
        # We query to deduplicate
        existing = self.db.client.table('research_signals').select('id').eq('owner_id', self.owner_id).eq('professor_id', professor_id).eq('signal_type', signal_type).eq('title', title).execute()
        
        data = {
            "owner_id": self.owner_id,
            "professor_id": professor_id,
            "university_id": university_id,
            "signal_type": signal_type,
            "title": title,
            "summary": summary,
            "signal_date": signal_date,
            "relevance_score": 10,
            "source_url": source_url
        }
        
        if not existing.data:
            self.db.client.table('research_signals').insert(data).execute()
        else:
            self.db.client.table('research_signals').update(data).eq('id', existing.data[0]['id']).execute()

    def evaluate_research_leads(self):
        print("Evaluating research leads...")
        # A research lead is generated if the professor has a good match score OR multiple strong signals
        profs = self.db.client.table('professors').select('id, name, university_id, recent_topics, fit_score').eq('owner_id', self.owner_id).execute()
        
        for prof in profs.data:
            prof_id = prof['id']
            uni_id = prof.get('university_id')
            
            # Re-evaluate fit score just in case
            topics = prof.get('recent_topics') or []
            match_res = self.matcher.match_professor(topics)
            score = match_res["score"]
            
            # Gather signals for evidence
            signals = self.db.client.table('research_signals').select('title, signal_type').eq('owner_id', self.owner_id).eq('professor_id', prof_id).execute()
            
            evidence_list = []
            if score >= 40:
                evidence_list.append("High topic alignment with profile.")
            
            for sig in signals.data:
                if sig['signal_type'] == "NEW_PROJECT":
                    evidence_list.append("Recent research project detected.")
                elif sig['signal_type'] == "PUBLICATION_ACTIVITY":
                    evidence_list.append("Relevant publication activity detected.")
                elif sig['signal_type'] == "RECRUITING":
                    evidence_list.append("New PhD recruitment language detected.")
                    
            # Deduplicate evidence
            evidence_list = list(set(evidence_list))
            
            # Determine if they meet the threshold for a lead
            if score >= 60 or (score >= 40 and len(evidence_list) >= 2):
                description = "\n- ".join(["Why detected:"] + evidence_list)
                
                # Deduplicate: check if lead exists
                existing = self.db.client.table('research_leads').select('id').eq('owner_id', self.owner_id).eq('professor_id', prof_id).execute()
                
                lead_data = {
                    "owner_id": self.owner_id,
                    "professor_id": prof_id,
                    "university_id": uni_id,
                    "lead_type": "RESEARCH_MATCH",
                    "title": f"Research Lead: {prof['name']}",
                    "description": description,
                    "evidence": {"signals": [s['title'] for s in signals.data], "match_explanation": match_res['explanation']},
                    "fit_score": score,
                    "fit_breakdown": match_res.get("fit_breakdown", {})
                }
                
                if existing.data:
                    self.db.client.table('research_leads').update(lead_data).eq('id', existing.data[0]['id']).execute()
                else:
                    lead_data["status"] = "NEW"
                    self.db.client.table('research_leads').insert(lead_data).execute()
                    print(f"Created Research Lead for {prof['name']}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python research_engine.py <owner_id>")
        sys.exit(1)
    db = DatabaseManager()
    engine = ResearchEngine(db, sys.argv[1])
    engine.process_signals()
    engine.evaluate_research_leads()
