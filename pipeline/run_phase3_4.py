import os
from database import DatabaseManager
from openalex_connector import OpenAlexConnector
from matcher import DeterministicMatcher

def run(owner_id: str):
    print("Starting Phase 3/4 Pipeline...")
    if not owner_id:
        print("Error: owner_id is required.")
        return

    db = DatabaseManager()
    
    # 1. Load user's actual settings/profile
    res = db.client.table('settings').select('*').eq('owner_id', owner_id).execute()
    if not res.data:
        print(f"User {owner_id} has no settings. Skipping Phase 3/4.")
        return
        
    profile = res.data[0]
    matcher = DeterministicMatcher(profile)
    openalex = OpenAlexConnector()
    
    # 2. Process Universities (verify existing universities in DB)
    unis_res = db.client.table('universities').select('*').eq('owner_id', owner_id).execute()
    
    for uni in unis_res.data:
        if not uni.get('verified'):
            print(f"Verifying University: {uni['name']}")
            uni_model = openalex.search_university(uni['name'])
            if uni_model:
                # We need to exclude None values and don't overwrite user changes
                update_data = uni_model.model_dump(exclude_none=True)
                update_data.pop('id', None)
                update_data.pop('owner_id', None)
                
                db.client.table('universities').update(update_data).eq('id', uni['id']).execute()
                print(f"Verified and updated {uni['name']}")
            else:
                print(f"Could not verify {uni['name']} via OpenAlex.")

    # 3. Match and Update existing Professors
    profs_res = db.client.table('professors').select('*').eq('owner_id', owner_id).execute()
    
    for prof in profs_res.data:
        print(f"Evaluating fit for Professor: {prof['name']}")
        
        # If openalex_author_id is missing but we have the name, try to find them
        if not prof.get('openalex_author_id'):
            uni_openalex_id = None
            if prof.get('university_id'):
                u_res = db.client.table('universities').select('openalex_id').eq('id', prof['university_id']).execute()
                if u_res.data and u_res.data[0].get('openalex_id'):
                    uni_openalex_id = u_res.data[0]['openalex_id']
                    
            prof_model = openalex.search_professor(prof['name'], uni_openalex_id)
            if prof_model:
                prof['openalex_author_id'] = prof_model.openalex_author_id
                prof['recent_topics'] = prof_model.recent_topics
                prof['h_index'] = prof_model.h_index
                prof['works_count'] = prof_model.works_count
                prof['cited_by_count'] = prof_model.cited_by_count

        if prof.get('recent_topics'):
            match_result = matcher.match_professor(prof['recent_topics'])
            
            update_data = {
                "fit_score": match_result["score"],
                "fit_reason": match_result["explanation"],
                "fit_breakdown": match_result.get("fit_breakdown", {})
            }
            if prof.get('openalex_author_id'):
                update_data['openalex_author_id'] = prof['openalex_author_id']
                update_data['recent_topics'] = prof['recent_topics']
                update_data['h_index'] = prof.get('h_index')
                update_data['works_count'] = prof.get('works_count')
                update_data['cited_by_count'] = prof.get('cited_by_count')
                
            db.client.table('professors').update(update_data).eq('id', prof['id']).execute()
            print(f"Updated {prof['name']} (Match Score: {match_result['score']})")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python run_phase3_4.py <owner_id>")
        sys.exit(1)
    run(sys.argv[1])
