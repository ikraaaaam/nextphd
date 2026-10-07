import requests
import hashlib
from database import DatabaseManager

class UniversityMonitor:
    def __init__(self, db_manager):
        self.db = db_manager
        
    def fetch_page(self, url: str) -> str:
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return resp.text
        except requests.exceptions.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return ""

    def generate_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def check_url(self, url: str, title: str, owner_id: str):
        if not url:
            return
            
        content = self.fetch_page(url)
        if not content:
            # We could emit a source warning here, but for now we just fail gracefully
            return
            
        content_hash = self.generate_hash(content)
        
        # Check if we have a previous document for this URL
        res = self.db.client.table('source_documents').select('content_hash').eq('external_url', url).eq('owner_id', owner_id).order('retrieved_at', desc=True).limit(1).execute()
        
        if res.data:
            last_hash = res.data[0]['content_hash']
            if last_hash == content_hash:
                print(f"No changes detected for {url}")
                return
            else:
                print(f"Changes detected for {url}")
        else:
            print(f"First time monitoring {url}")
            
        # Store the new document
        doc_data = {
            "owner_id": owner_id,
            "external_url": url,
            "title": title,
            "content_hash": content_hash,
            "raw_text": content,
            "content_type": "HTML",
            "extraction_status": "PENDING"
        }
        self.db.client.table('source_documents').insert(doc_data).execute()
        print(f"Stored source document for {url}")

def run_monitor(owner_id: str):
    db = DatabaseManager()
    monitor = UniversityMonitor(db)
    
    # Fetch universities for this owner
    unis_res = db.client.table('universities').select('*').eq('owner_id', owner_id).execute()
    
    for uni in unis_res.data:
        url = uni.get('website')
        if url:
            monitor.check_url(url, f"{uni['name']} Homepage", owner_id)
        else:
            print(f"University {uni['name']} has no website configured for monitoring.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python university_monitor.py <owner_id>")
        sys.exit(1)
    run_monitor(sys.argv[1])
