import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from models import OpportunityModel

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use service role for backend pipeline, or anon key if authenticating

class DatabaseManager:
    def __init__(self):
        if not SUPABASE_KEY:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY is required for pipeline insertion.")
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    def store_opportunity(self, opp: OpportunityModel, owner_id: str):
        if not owner_id:
            raise ValueError("owner_id is required.")
        
        data = opp.model_dump(mode='json')
        data["owner_id"] = owner_id
        
        # We need to link to a source in `sources` table if it exists.
        # Let's see if we can find or create the source.
        source_name = opp.source
        
        source_res = self.client.table('sources').select('id').eq('owner_id', owner_id).eq('name', source_name).execute()
        source_id = None
        if source_res.data:
            source_id = source_res.data[0]['id']
        else:
            new_source = {
                "owner_id": owner_id,
                "name": source_name,
                "source_type": "RSS",
                "enabled": True
            }
            insert_res = self.client.table('sources').insert(new_source).execute()
            source_id = insert_res.data[0]['id']

        data["source_id"] = source_id
        
        # Check if exists to detect changes
        existing_res = self.client.table("opportunities").select("*").eq("owner_id", owner_id).eq("hash", data["hash"]).execute()
        if existing_res.data:
            existing = existing_res.data[0]
            changes = []
            
            # Compare deadline
            old_dl = existing.get("deadline")
            new_dl = data.get("deadline")
            if new_dl and isinstance(new_dl, str) and old_dl != new_dl:
                changes.append(f"Deadline changed: {old_dl} -> {new_dl}")
                
            # Compare funding_class
            old_fc = existing.get("funding_class")
            new_fc = data.get("funding_class")
            if new_fc and new_fc != "UNKNOWN" and old_fc != new_fc:
                changes.append(f"Funding changed: {old_fc} -> {new_fc}")
                
            # Compare status (open/closed)
            old_st = existing.get("status")
            new_st = data.get("status")
            if new_st and old_st != new_st:
                changes.append(f"Status changed: {old_st} -> {new_st}")

            # Append changes to notes to preserve history
            if changes:
                change_str = "\n".join(changes)
                new_notes = (existing.get("notes") or "") + f"\n\n[Change Detected {datetime.now().isoformat()}]:\n{change_str}"
                
                # Normalize values
                update_data = {
                    "last_seen": "now()",
                    "deadline": new_dl or old_dl,
                    "funding_class": new_fc or old_fc,
                    "status": new_st or old_st,
                    "notes": new_notes
                }
                self.client.table("opportunities").update(update_data).eq("owner_id", owner_id).eq("hash", data["hash"]).execute()
                return "CHANGED: " + ", ".join(changes)
            else:
                self.client.table("opportunities").update({"last_seen": "now()"}).eq("owner_id", owner_id).eq("hash", data["hash"]).execute()
                return "DUPLICATE"
                
        # Insert new
        try:
            self.client.table("opportunities").insert(data).execute()
            return "NEW"
        except Exception as e:
            print(f"Error inserting {data['hash']}: {e}")
            return "ERROR"
            
    def store_professor(self, prof_model: dict):
        # We assume prof_model is a dict with professor data
        openalex_id = prof_model.get("openalex_author_id")
        if not openalex_id:
            res = self.client.table('professors').upsert(prof_model, on_conflict='owner_id, openalex_author_id').execute()
            return res.data[0]['id'] if res.data else None
            
        existing_res = self.client.table("professors").select("*").eq("owner_id", prof_model["owner_id"]).eq("openalex_author_id", openalex_id).execute()
        
        if existing_res.data:
            existing = existing_res.data[0]
            old_uni_id = existing.get("university_id")
            new_uni_id = prof_model.get("university_id")
            
            old_dept = existing.get("department")
            new_dept = prof_model.get("department")
            
            changes = []
            if old_uni_id and new_uni_id and old_uni_id != new_uni_id:
                # get university names to make the signal human readable
                old_u_name = "Unknown"
                new_u_name = "Unknown"
                
                old_u_res = self.client.table("universities").select("name").eq("id", old_uni_id).execute()
                if old_u_res.data: old_u_name = old_u_res.data[0]["name"]
                
                new_u_res = self.client.table("universities").select("name").eq("id", new_uni_id).execute()
                if new_u_res.data: new_u_name = new_u_res.data[0]["name"]
                
                changes.append(f"University changed from {old_u_name} to {new_u_name}")
                
            if old_dept and new_dept and old_dept != new_dept:
                changes.append(f"Department changed from {old_dept} to {new_dept}")
                
            if changes:
                # Create a research signal for the change
                sig_data = {
                    "owner_id": prof_model["owner_id"],
                    "professor_id": existing["id"],
                    "university_id": new_uni_id,
                    "signal_type": "AFFILIATION_CHANGE",
                    "title": "Professor Affiliation Change",
                    "summary": ". ".join(changes),
                    "signal_date": datetime.now().strftime('%Y-%m-%d'),
                    "relevance_score": 8
                }
                
                # deduplicate signal
                sig_exist = self.client.table("research_signals").select("id").eq("professor_id", existing["id"]).eq("signal_type", "AFFILIATION_CHANGE").eq("summary", sig_data["summary"]).execute()
                if not sig_exist.data:
                    self.client.table("research_signals").insert(sig_data).execute()
                    
        # Update/insert the professor
        res = self.client.table('professors').upsert(prof_model, on_conflict='owner_id, openalex_author_id').execute()
        return res.data[0]['id'] if res.data else None

