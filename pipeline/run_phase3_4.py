import os
from database import DatabaseManager
from openalex_connector import OpenAlexConnector
from matcher import DeterministicMatcher
from models import UniversityModel, ProfessorModel

def get_test_profile():
    return {
        "research_background": {
            "interests": [
                "Biomedical AI",
                "Biomedical Signal Processing",
                "EEG",
                "Wearable Sensing",
                "Healthcare AI",
                "Machine Learning",
                "Deep Learning"
            ]
        },
        "technical_skills": {
            "skills": ["Python", "PyTorch", "TensorFlow", "Signal Processing", "Data Science"]
        },
        "preferences": {
            "funding": "FULLY_FUNDED",
            "countries": ["USA", "Canada", "Australia", "Switzerland", "Germany"]
        }
    }

def run(owner_id: str):
    print("Starting Phase 3/4 Pipeline...")
    db = DatabaseManager()
    openalex = OpenAlexConnector()
    matcher = DeterministicMatcher(get_test_profile())
    
    # Ensure profile is stored in settings
    db.client.table('settings').upsert({
        'owner_id': owner_id,
        'research_background': get_test_profile()["research_background"],
        'technical_skills': get_test_profile()["technical_skills"],
        'preferences': get_test_profile()["preferences"]
    }, on_conflict='owner_id').execute()

    print("Fetching University: MIT")
    uni_model = openalex.search_university("Massachusetts Institute of Technology")
    
    uni_id = None
    if uni_model:
        # Match university country against preferences (bonus points could be added)
        # Store University
        data = uni_model.model_dump()
        data["owner_id"] = owner_id
        res = db.client.table('universities').upsert(data, on_conflict='owner_id, name').execute()
        
        if res.data:
            uni_id = res.data[0]['id']
            print(f"Stored University: {uni_model.name} (ID: {uni_id})")
        else:
            print("Failed to store university")
            
    print("Fetching Professor: Dina Katabi")
    prof_model = openalex.search_professor("Dina Katabi", uni_model.openalex_id if uni_model else None)
    
    if prof_model:
        # Match professor
        match_result = matcher.match_professor(prof_model.recent_topics)
        
        data = prof_model.model_dump(exclude={'university_name'})
        data["owner_id"] = owner_id
        if uni_id:
            data["university_id"] = uni_id
            
        data["fit_score"] = match_result["score"]
        data["fit_reason"] = match_result["explanation"]
        data["fit_breakdown"] = match_result.get("fit_breakdown", {})
        
        prof_id = db.store_professor(data)
        if prof_id:
            print(f"Stored Professor: {prof_model.name} (Match Score: {match_result['score']})")
            print(f"Reason: {match_result['explanation']}")
        else:
            print("Failed to store professor")

if __name__ == "__main__":
    run()
