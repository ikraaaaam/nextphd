import unittest
import sys
from unittest.mock import MagicMock
sys.modules['database'] = MagicMock()

from research_engine import ResearchEngine

class MockDatabaseClient:
    def __init__(self):
        self.tables = {
            'settings': [],
            'professors': [],
            'professor_projects': [],
            'research_signals': [],
            'research_leads': [],
            'publications': [],
            'emerging_topics': []
        }
        
    def table(self, name):
        return MockTable(self.tables, name)

class MockTable:
    def __init__(self, db_tables, name):
        self.db_tables = db_tables
        self.name = name
        self.query_conditions = []
        self.update_data = None
        
    def select(self, *args):
        return self
        
    def eq(self, col, val):
        self.query_conditions.append(('eq', col, val))
        return self
        
    def gte(self, col, val):
        self.query_conditions.append(('gte', col, val))
        return self
        
    def execute(self):
        # Very simple mock evaluation
        results = []
        for row in self.db_tables[self.name]:
            match = True
            for op, col, val in self.query_conditions:
                row_val = row.get(col)
                if op == 'eq':
                    if row_val != val:
                        match = False
                        break
                elif op == 'gte':
                    if row_val is None or row_val < val:
                        match = False
                        break
            if match:
                if self.update_data:
                    row.update(self.update_data)
                results.append(row)
        
        self.update_data = None
        self.query_conditions = []
        
        class Result:
            pass
        res = Result()
        res.data = results
        return res
        
    def insert(self, data):
        if isinstance(data, list):
            self.db_tables[self.name].extend(data)
        else:
            self.db_tables[self.name].append(data)
        
        class MockInsertResult:
            def __init__(self, d):
                class Result:
                    pass
                self.res = Result()
                self.res.data = [d] if not isinstance(d, list) else d
            def execute(self):
                return self.res
        return MockInsertResult(data)

    def update(self, data):
        self.update_data = data
        return self

class MockDatabaseManager:
    def __init__(self):
        self.client = MockDatabaseClient()


class TestPhase5ResearchEngine(unittest.TestCase):
    def setUp(self):
        self.db = MockDatabaseManager()
        self.owner_id = "test-owner"
        
        # Setup settings
        self.db.client.tables['settings'].append({
            "owner_id": self.owner_id,
            "research_background": {"interests": ["Machine Learning", "EEG"]},
            "technical_skills": {"skills": ["Python"]},
            "preferences": {"funding": "FULLY_FUNDED"}
        })
        
        self.engine = ResearchEngine(self.db, self.owner_id)

    def test_process_signals_creates_project_signal(self):
        self.db.client.tables['professor_projects'].append({
            "id": "proj-1",
            "owner_id": self.owner_id,
            "professor_id": "prof-1",
            "title": "Novel BCI Project",
            "start_date": "2026-01-01"
        })
        
        self.engine.process_signals()
        
        signals = self.db.client.tables['research_signals']
        self.assertEqual(len(signals), 1)
        self.assertEqual(signals[0]['signal_type'], "NEW_PROJECT")
        self.assertIn("Novel BCI Project", signals[0]['title'])

    def test_process_signals_creates_publication_signal(self):
        self.db.client.tables['professors'].append({
            "id": "prof-1",
            "owner_id": self.owner_id,
            "name": "Dr. Smith",
            "recent_topics": ["Machine Learning", "EEG"]
        })
        
        self.db.client.tables['publications'].append({
            "id": "pub-1",
            "owner_id": self.owner_id,
            "professor_id": "prof-1",
            "openalex_id": "openalex-1",
            "title": "Recent EEG Paper",
            "publication_date": "2026-01-01",
            "topics": ["Machine Learning", "EEG"]
        })
        self.db.client.tables['publications'].append({
            "id": "pub-2",
            "owner_id": self.owner_id,
            "professor_id": "prof-1",
            "openalex_id": "openalex-2",
            "title": "Another ML Paper",
            "publication_date": "2026-02-01",
            "topics": ["Machine Learning", "BCI"]
        })
        
        self.engine.process_signals()
        
        signals = self.db.client.tables['research_signals']
        self.assertEqual(len(signals), 1)
        self.assertEqual(signals[0]['signal_type'], "PUBLICATION_ACTIVITY")

    def test_evaluate_research_leads(self):
        self.db.client.tables['professors'].append({
            "id": "prof-1",
            "owner_id": self.owner_id,
            "name": "Dr. Smith",
            "recent_topics": ["Machine Learning", "EEG"],
            "works_count": 10,
            "fit_score": 80
        })
        
        self.engine.evaluate_research_leads()
        
        leads = self.db.client.tables['research_leads']
        self.assertEqual(len(leads), 1)
        self.assertEqual(leads[0]['professor_id'], "prof-1")
        self.assertEqual(leads[0]['status'], "NEW")

    def test_evaluate_research_leads_deduplication(self):
        self.db.client.tables['professors'].append({
            "id": "prof-1",
            "owner_id": self.owner_id,
            "name": "Dr. Smith",
            "recent_topics": ["Machine Learning", "EEG"],
            "fit_score": 80
        })
        
        self.db.client.tables['research_leads'].append({
            "id": "lead-1",
            "owner_id": self.owner_id,
            "professor_id": "prof-1",
            "status": "INTERESTED"
        })
        
        self.engine.evaluate_research_leads()
        
        leads = self.db.client.tables['research_leads']
        self.assertEqual(len(leads), 1)
        # the status shouldn't be overwritten to NEW because it's an update, but wait my update logic overrides it?
        # Actually my code does lead_data["status"] = "NEW" only if it doesn't exist. Let's verify.
        self.assertEqual(leads[0]['status'], "INTERESTED")

    def test_evaluate_emerging_topics_creates_candidate(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        baseline = (now - timedelta(days=400)).strftime('%Y-%m-%d')
        
        # 3 recent, 1 baseline -> should be candidate
        for i in range(3):
            self.db.client.tables['publications'].append({
                "id": f"pub-recent-{i}",
                "owner_id": self.owner_id,
                "openalex_id": f"openalex-recent-{i}",
                "publication_date": recent,
                "topics": ["EEG"]
            })
        self.db.client.tables['publications'].append({
            "id": "pub-base-1",
            "owner_id": self.owner_id,
            "openalex_id": "openalex-base-1",
            "publication_date": baseline,
            "topics": ["EEG"]
        })
        
        self.engine._evaluate_emerging_topics()
        topics = self.db.client.tables['emerging_topics']
        self.assertEqual(len(topics), 1)
        self.assertEqual(topics[0]['topic'], "EEG")
        self.assertEqual(topics[0]['recent_count'], 3)
        self.assertEqual(topics[0]['baseline_count'], 1)

    def test_evaluate_emerging_topics_insufficient_recent(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # only 2 recent -> no candidate
        for i in range(2):
            self.db.client.tables['publications'].append({
                "id": f"pub-recent-{i}",
                "owner_id": self.owner_id,
                "openalex_id": f"openalex-recent-{i}",
                "publication_date": recent,
                "topics": ["BCI"]
            })
            
        self.engine._evaluate_emerging_topics()
        topics = self.db.client.tables['emerging_topics']
        # Assert no candidate for BCI
        bci_topics = [t for t in topics if t['topic'] == 'BCI']
        self.assertEqual(len(bci_topics), 0)

    def test_evaluate_emerging_topics_no_increase(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        baseline = (now - timedelta(days=400)).strftime('%Y-%m-%d')
        
        # 3 recent, 5 baseline -> no candidate
        for i in range(3):
            self.db.client.tables['publications'].append({
                "id": f"pub-recent-{i}",
                "owner_id": self.owner_id,
                "openalex_id": f"openalex-recent-{i}",
                "publication_date": recent,
                "topics": ["ML"]
            })
        for i in range(5):
            self.db.client.tables['publications'].append({
                "id": f"pub-base-{i}",
                "owner_id": self.owner_id,
                "openalex_id": f"openalex-base-{i}",
                "publication_date": baseline,
                "topics": ["ML"]
            })
            
        self.engine._evaluate_emerging_topics()
        topics = self.db.client.tables['emerging_topics']
        ml_topics = [t for t in topics if t['topic'] == 'ML']
        self.assertEqual(len(ml_topics), 0)

    def test_evaluate_emerging_topics_zero_baseline(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # 3 recent, 0 baseline -> should be candidate with correct growth
        for i in range(3):
            self.db.client.tables['publications'].append({
                "id": f"pub-recent-{i}",
                "owner_id": self.owner_id,
                "openalex_id": f"openalex-recent-{i}",
                "publication_date": recent,
                "topics": ["ZeroBase"]
            })
            
        self.engine._evaluate_emerging_topics()
        topics = self.db.client.tables['emerging_topics']
        zb_topics = [t for t in topics if t['topic'] == 'ZeroBase']
        self.assertEqual(len(zb_topics), 1)
        self.assertEqual(zb_topics[0]['baseline_count'], 0)
        self.assertEqual(zb_topics[0]['growth_measure'], 3.0)

    def test_evaluate_emerging_topics_duplicate_pubs(self):
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        recent = (now - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # 3 identical publications -> count as 1
        for i in range(3):
            self.db.client.tables['publications'].append({
                "id": f"pub-recent-{i}",
                "owner_id": self.owner_id,
                "openalex_id": f"openalex-recent-SAME",
                "publication_date": recent,
                "topics": ["DupTopic"]
            })
            
        self.engine._evaluate_emerging_topics()
        topics = self.db.client.tables['emerging_topics']
        dup_topics = [t for t in topics if t['topic'] == 'DupTopic']
        self.assertEqual(len(dup_topics), 0) # Only 1 recent count, min is 3

    def test_evaluate_emerging_topics_missing_dates(self):
        # publication with no date -> ignored safely
        self.db.client.tables['publications'].append({
            "id": f"pub-recent-nodate",
            "owner_id": self.owner_id,
            "openalex_id": f"openalex-recent-nodate",
            "publication_date": None,
            "topics": ["NoDateTopic"]
        })
        self.engine._evaluate_emerging_topics()
        topics = self.db.client.tables['emerging_topics']
        nd_topics = [t for t in topics if t['topic'] == 'NoDateTopic']
        self.assertEqual(len(nd_topics), 0)

if __name__ == '__main__':
    unittest.main()
