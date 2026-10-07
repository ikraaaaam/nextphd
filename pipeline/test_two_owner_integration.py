import unittest
from database import DatabaseManager
from intelligence_cycle import IntelligenceCycle
import os
import uuid

class TestTwoOwnerIntegration(unittest.TestCase):
    def setUp(self):
        self.db = DatabaseManager() # Uses service role by default in tests
        self.owner_a = "11111111-1111-1111-1111-111111111111"
        self.owner_b = "22222222-2222-2222-2222-222222222222"

        # Ensure settings exist so they are recognized by scheduler / pipeline
        self.db.client.table('settings').upsert([
            {"owner_id": self.owner_a},
            {"owner_id": self.owner_b}
        ], on_conflict='owner_id').execute()
        
        # Clean up any existing test data for these owners
        self.db.client.table('opportunities').delete().in_('owner_id', [self.owner_a, self.owner_b]).execute()
        self.db.client.table('sources').delete().in_('owner_id', [self.owner_a, self.owner_b]).execute()

    def test_isolation(self):
        # 1. Setup a dummy source for A
        self.db.client.table('sources').insert({
            "owner_id": self.owner_a,
            "name": "Test Source A",
            "source_type": "UNIVERSITY",
            "base_url": "http://a.com",
            "enabled": True
        }).execute()

        # Setup a dummy source for B
        self.db.client.table('sources').insert({
            "owner_id": self.owner_b,
            "name": "Test Source B",
            "source_type": "UNIVERSITY",
            "base_url": "http://b.com",
            "enabled": True
        }).execute()

        # 2. Run cycle for A
        # We will mock the extractor so it returns an opportunity for A
        cycle_a = IntelligenceCycle(self.owner_a)
        
        # Insert a dummy opp directly through cycle_a's db manager to simulate discovery
        # The database.py we fixed should correctly scope it.
        # Let's call store_opportunity.
        from models import OpportunityModel
        opp_a = OpportunityModel(title="Opp A", link="http://a.com/1", summary="Sum A", published_date="2024-01-01", deadline=None, funding_class=None, hash="hash_a", source="Test Source A", source_url="http://a.com")
        res_a = cycle_a.db.store_opportunity(opp_a, self.owner_a)
        self.assertEqual(res_a, "NEW")
        
        # Insert a dummy opp for B using cycle_b
        cycle_b = IntelligenceCycle(self.owner_b)
        opp_b = OpportunityModel(title="Opp B", link="http://b.com/1", summary="Sum B", published_date="2024-01-01", deadline=None, funding_class=None, hash="hash_b", source="Test Source B", source_url="http://b.com")
        res_b = cycle_b.db.store_opportunity(opp_b, self.owner_b)
        self.assertEqual(res_b, "NEW")
        
        # 3. Verify Isolation via Service Role Queries
        opps_a = self.db.client.table('opportunities').select('*').eq('owner_id', self.owner_a).execute().data
        opps_b = self.db.client.table('opportunities').select('*').eq('owner_id', self.owner_b).execute().data
        
        self.assertEqual(len(opps_a), 1)
        self.assertEqual(opps_a[0]['title'], "Opp A")
        
        self.assertEqual(len(opps_b), 1)
        self.assertEqual(opps_b[0]['title'], "Opp B")
        
        # 4. Verify cross-updates don't occur
        # Let's say B discovers an opportunity with same title/link (e.g. from an aggregator)
        # It should NOT update A's opportunity.
        opp_b2 = OpportunityModel(title="Opp A", link="http://a.com/1", summary="Sum A2", published_date="2024-01-01", deadline="2025-01-01", funding_class=None, hash="hash_a", source="Test Source A", source_url="http://a.com")
        res_b2 = cycle_b.db.store_opportunity(opp_b2, self.owner_b)
        
        # Since B didn't have this opp, it should be NEW for B, not UPDATED
        self.assertEqual(res_b2, "NEW")
        
        # Check A's opp again, deadline should NOT be updated.
        opps_a_after = self.db.client.table('opportunities').select('*').eq('owner_id', self.owner_a).execute().data
        self.assertIsNone(opps_a_after[0]['deadline'])

if __name__ == '__main__':
    unittest.main()
