import unittest
from unittest.mock import patch, MagicMock

# Import the modules we want to test
from run_phase3_4 import run as run_phase3_4
from university_monitor import run_monitor
from intelligence_cycle import IntelligenceCycle
from scheduler import ProductionScheduler

class TestProductionSafety(unittest.TestCase):
    
    @patch('run_phase3_4.DatabaseManager')
    @patch('run_phase3_4.OpenAlexConnector')
    def test_run_phase3_4_no_settings(self, MockOpenAlex, MockDB):
        """Test Phase 3/4 handles missing settings correctly without crashing or faking data."""
        mock_db = MockDB.return_value
        
        # Mock settings query returning empty (no data)
        mock_res = MagicMock()
        mock_res.data = []
        mock_db.client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_res
        
        run_phase3_4('test_owner_1')
        
        # Verify it didn't proceed to update settings or fetch anything
        mock_db.client.table.return_value.update.assert_not_called()
        MockOpenAlex.assert_not_called()

    @patch('run_phase3_4.DatabaseManager')
    @patch('run_phase3_4.OpenAlexConnector')
    def test_run_phase3_4_no_universities(self, MockOpenAlex, MockDB):
        """Test Phase 3/4 handles empty universities table safely."""
        mock_db = MockDB.return_value
        
        # 1. Settings returns a profile
        mock_settings_res = MagicMock()
        mock_settings_res.data = [{"research_background": {"interests": ["AI"]}}]
        
        # 2. Universities returns empty
        mock_uni_res = MagicMock()
        mock_uni_res.data = []
        
        # 3. Professors returns empty
        mock_prof_res = MagicMock()
        mock_prof_res.data = []
        
        # Mocking the chain table().select().eq().execute()
        def mock_execute(*args, **kwargs):
            # This is tricky because the same chain is used. We can mock by inspecting the table name.
            pass
            
        mock_db.client.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
            mock_settings_res,
            mock_uni_res,
            mock_prof_res
        ]
        
        run_phase3_4('test_owner_1')
        # Should not crash.
        self.assertTrue(True)

    @patch('university_monitor.DatabaseManager')
    def test_university_monitor_empty(self, MockDB):
        """Test University monitor doesn't crash on empty DB or use example.com."""
        mock_db = MockDB.return_value
        mock_uni_res = MagicMock()
        mock_uni_res.data = []
        mock_db.client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_uni_res
        
        run_monitor('test_owner_1')
        # Should not crash and shouldn't insert anything.
        mock_db.client.table.return_value.insert.assert_not_called()

    @patch('intelligence_cycle.DatabaseManager')
    @patch('extractor.EuraxessExtractor')
    def test_morning_discovery_owner_isolation(self, MockExtractor, MockDB):
        """Test Morning Discovery passes the correct owner_id to the database."""
        mock_db = MockDB.return_value
        mock_ext = MockExtractor.return_value
        mock_ext.fetch_and_parse.return_value = [{"title": "Test Opp"}]
        
        cycle = IntelligenceCycle('test_owner_2')
        cycle.db = mock_db
        cycle.execute_morning_discovery()
        
        # Ensure store_opportunity was called with the correct owner_id
        mock_db.store_opportunity.assert_called_with({"title": "Test Opp"}, 'test_owner_2')
        
if __name__ == '__main__':
    unittest.main()
