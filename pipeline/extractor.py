import feedparser
import re
from datetime import datetime
from bs4 import BeautifulSoup
from models import OpportunityModel

class EuraxessExtractor:
    """Extract PhD positions from a public RSS feed (e.g. EURAXESS or equivalent standard RSS format)."""
    
    def __init__(self, rss_url="https://weworkremotely.com/remote-jobs.rss"):
        self.rss_url = rss_url

    def fetch_and_parse(self):
        # Setting a standard user-agent just in case
        import requests
        try:
            r = requests.get(self.rss_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            feed = feedparser.parse(r.content)
        except Exception as e:
            # Handle invalid URL / timeout gracefully
            return []
            
        opportunities = []
        for entry in feed.entries:
            try:
                opp = self.process_entry(entry)
                if opp:
                    opportunities.append(opp)
            except Exception as e:
                pass # Skip malformed
        return opportunities
        
    def extract_deadline(self, text: str):
        # Match Deadline: YYYY-MM-DD or DD/MM/YYYY
        match = re.search(r'(?i)(?:deadline|closing date|apply by)[\s:]*(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})', text)
        if match:
            date_str = match.group(1)
            try:
                if '-' in date_str:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                else:
                    return datetime.strptime(date_str, "%d/%m/%Y").date()
            except ValueError:
                return None
        return None

    def process_entry(self, entry) -> OpportunityModel:
        title = entry.get('title', '')
        if not title:
            raise ValueError("title is required")
            
        link = entry.get('link', '')
        summary = entry.get('summary', '')
            
        hash_val = OpportunityModel.generate_hash(title, link)
        
        soup = BeautifulSoup(summary, "html.parser")
        text_summary = soup.get_text(separator=" ", strip=True)

        deadline = self.extract_deadline(text_summary)
        
        published_parsed = entry.get('published_parsed')
        posted_on = None
        if published_parsed:
            posted_on = datetime(*published_parsed[:6]).date()

        funding_class = "UNKNOWN"
        if "fully funded" in text_summary.lower() or "fully funded" in title.lower():
            funding_class = "FULLY_FUNDED"

        return OpportunityModel(
            hash=hash_val,
            title=title.strip(),
            source="WE_WORK_REMOTELY_RSS",
            source_url=link,
            official_url=link,
            posted_on=posted_on,
            deadline=deadline,
            funding_class=funding_class,
            notes=text_summary[:500] + ("..." if len(text_summary)>500 else "")
        )
