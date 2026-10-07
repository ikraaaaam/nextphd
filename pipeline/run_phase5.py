import os
from database import DatabaseManager
from openalex_connector import OpenAlexConnector
from research_engine import ResearchEngine

def run(owner_id: str):
    print("Starting Phase 5 Pipeline...")
    db = DatabaseManager()
    openalex = OpenAlexConnector()
    engine = ResearchEngine(db, owner_id)
    
    # 1. Fetch recent works for existing professors and store in `publications`
    profs = db.client.table('professors').select('id, name, openalex_author_id').eq('owner_id', owner_id).execute()
    
    for prof in profs.data:
        if prof.get('openalex_author_id'):
            print(f"Fetching recent works for {prof['name']}...")
            author_id = prof['openalex_author_id'].split('/')[-1]
            works = openalex.fetch_recent_works(author_id, limit=5)
            
            for work in works:
                pub_data = {
                    "owner_id": owner_id,
                    "professor_id": prof['id'],
                    "openalex_id": work["openalex_id"],
                    "title": work["title"],
                    "publication_date": work["publication_date"],
                    "topics": work["topics"],
                    "source_url": work["source_url"]
                }
                db.client.table('publications').upsert(pub_data, on_conflict='owner_id, openalex_id').execute()
    
    # 2. Run research engine to generate signals and leads based on evidence
    engine.process_signals()
    engine.evaluate_research_leads()
    print("Phase 5 Pipeline Complete.")

if __name__ == "__main__":
    run()
