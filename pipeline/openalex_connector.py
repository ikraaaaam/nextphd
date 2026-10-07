import requests
from models import UniversityModel, ProfessorModel

class OpenAlexConnector:
    """Fetch university and professor data from OpenAlex API."""
    
    BASE_URL = "https://api.openalex.org"
    
    def __init__(self, email="contact@example.com"):
        # OpenAlex requests an email in the user-agent for the polite pool
        self.headers = {"User-Agent": f"mailto:{email}"}
        
    def search_university(self, name: str) -> UniversityModel:
        url = f"{self.BASE_URL}/institutions?search={requests.utils.quote(name)}"
        resp = requests.get(url, headers=self.headers).json()
        
        if not resp.get("results"):
            return None
            
        best = resp["results"][0]
        
        return UniversityModel(
            name=best.get("display_name"),
            country=best.get("country_code"),
            city=best.get("geo", {}).get("city"),
            openalex_id=best.get("id"),
            website=best.get("homepage_url"),
            verified=True,
            source_url=best.get("id"),
            works_count=best.get("works_count"),
            cited_by_count=best.get("cited_by_count")
        )

    def search_professor(self, name: str, university_openalex_id: str = None) -> ProfessorModel:
        query = f"display_name.search:{name}"
        if university_openalex_id:
            # Filter by last known institution
            inst_id = university_openalex_id.split("/")[-1]
            query += f",last_known_institutions.id:{inst_id}"
            
        url = f"{self.BASE_URL}/authors?filter={query}"
        resp = requests.get(url, headers=self.headers).json()
        
        if not resp.get("results"):
            return None
            
        best = resp["results"][0]
        
        # Get topics
        topics = []
        if "topics" in best:
            for t in best["topics"][:5]:
                topics.append(t.get("display_name"))
        elif "x_concepts" in best:
            for c in best["x_concepts"][:5]:
                topics.append(c.get("display_name"))
                
        return ProfessorModel(
            name=best.get("display_name"),
            openalex_author_id=best.get("id"),
            h_index=best.get("summary_stats", {}).get("h_index"),
            works_count=best.get("works_count"),
            cited_by_count=best.get("cited_by_count"),
            recent_topics=topics
        )

    def fetch_recent_works(self, author_id: str, limit: int = 10):
        url = f"{self.BASE_URL}/works?filter=author.id:{author_id}&sort=publication_date:desc&per-page={limit}"
        resp = requests.get(url, headers=self.headers).json()
        
        results = []
        for work in resp.get("results", []):
            topics = []
            if "topics" in work:
                for t in work["topics"][:5]:
                    topics.append(t.get("display_name"))
                    
            results.append({
                "openalex_id": work.get("id"),
                "title": work.get("title"),
                "publication_date": work.get("publication_date"),
                "topics": topics,
                "source_url": work.get("id")
            })
        return results
