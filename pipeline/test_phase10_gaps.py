import unittest
import time
from datetime import datetime, timezone
from database import DatabaseManager
from intelligence_cycle import IntelligenceCycle

TEST_OWNER_ID = "11111111-1111-1111-1111-111111111111"

class TestPhase10Gaps(unittest.TestCase):
    def setUp(self):
        self.db = DatabaseManager()
        self.owner_id = TEST_OWNER_ID
        
        # Clean up test data
        self.db.client.table('universities').delete().eq('owner_id', self.owner_id).in_('name', ['Test Uni A', 'Test Uni B']).execute()
        self.db.client.table('professors').delete().eq('owner_id', self.owner_id).eq('name', 'Test Prof X').execute()
        self.db.client.table('opportunities').delete().eq('owner_id', self.owner_id).eq('title', 'Test Fav Opp').execute()
        self.db.client.table('research_signals').delete().eq('owner_id', self.owner_id).eq('title', 'Professor Affiliation Change').execute()

    def test_professor_affiliation_idempotency(self):
        # 1. Setup universities
        uni_a = self.db.client.table('universities').insert({"owner_id": self.owner_id, "name": "Test Uni A"}).execute().data[0]
        uni_b = self.db.client.table('universities').insert({"owner_id": self.owner_id, "name": "Test Uni B"}).execute().data[0]
        
        # 2. Add professor at Uni A
        prof_id = self.db.store_professor({
            "owner_id": self.owner_id,
            "openalex_author_id": "test_auth_123",
            "name": "Test Prof X",
            "university_id": uni_a['id'],
            "department": "Dept A"
        })
        self.assertIsNotNone(prof_id)
        
        # Verify no affiliation change signal yet
        sigs = self.db.client.table('research_signals').select('*').eq('professor_id', prof_id).eq('signal_type', 'AFFILIATION_CHANGE').execute()
        self.assertEqual(len(sigs.data), 0)
        
        # 3. Update professor to Uni B (A -> B produces one event)
        self.db.store_professor({
            "owner_id": self.owner_id,
            "openalex_author_id": "test_auth_123",
            "name": "Test Prof X",
            "university_id": uni_b['id'],
            "department": "Dept B"
        })
        
        # Verify one affiliation change signal
        sigs = self.db.client.table('research_signals').select('*').eq('professor_id', prof_id).eq('signal_type', 'AFFILIATION_CHANGE').execute()
        self.assertEqual(len(sigs.data), 1)
        self.assertIn("Test Uni B", sigs.data[0]['summary'])
        
        # 4. Processing B again produces none
        self.db.store_professor({
            "owner_id": self.owner_id,
            "openalex_author_id": "test_auth_123",
            "name": "Test Prof X",
            "university_id": uni_b['id'],
            "department": "Dept B"
        })
        
        # Verify STILL only one affiliation change signal
        sigs = self.db.client.table('research_signals').select('*').eq('professor_id', prof_id).eq('signal_type', 'AFFILIATION_CHANGE').execute()
        self.assertEqual(len(sigs.data), 1)
        
    def test_favourite_updates(self):
        cycle = IntelligenceCycle(self.owner_id)
        
        # 1. Add favourited Uni
        uni = self.db.client.table('universities').insert({"owner_id": self.owner_id, "name": "Test Uni A", "is_favourite": True}).execute().data[0]
        
        # Generate digest BEFORE any meaningful change
        cycle.execute_evening_digest()
        digest = self.db.client.table('digests').select('summary_md').eq('owner_id', self.owner_id).order('created_at', desc=True).limit(1).execute().data[0]
        self.assertNotIn("New/Updated Opportunity: Test Fav Opp", digest['summary_md'])
        
        # 2. Add an opportunity for that university (meaningful change)
        self.db.client.table('opportunities').insert({
            "owner_id": self.owner_id,
            "hash": "test_opp_hash",
            "title": "Test Fav Opp",
            "university_id": uni['id'],
            "last_seen": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Generate digest AFTER change -> exactly one update
        cycle.execute_evening_digest()
        digest = self.db.client.table('digests').select('summary_md').eq('owner_id', self.owner_id).order('created_at', desc=True).limit(1).execute().data[0]
        self.assertIn("New/Updated Opportunity: Test Fav Opp", digest['summary_md'])
        
        # Count occurrences in digest to ensure no duplication
        count = digest['summary_md'].count("New/Updated Opportunity: Test Fav Opp")
        self.assertEqual(count, 1)

if __name__ == "__main__":
    unittest.main()
