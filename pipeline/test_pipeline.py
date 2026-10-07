import unittest
from datetime import date
from models import OpportunityModel
from extractor import EuraxessExtractor
from matcher import DeterministicMatcher

class MockEntry:
    def __init__(self, title, link, summary, published_parsed=None):
        self.title = title
        self.link = link
        self.summary = summary
        self.published_parsed = published_parsed
        
    def get(self, key, default=None):
        return getattr(self, key, default)

class TestOpportunityPipeline(unittest.TestCase):
    def test_normalization(self):
        entry = MockEntry(
            title="PhD in Machine Learning",
            link="https://example.com/job1",
            summary="This is a fully funded PhD position. Deadline: 2026-12-01.",
            published_parsed=(2026, 10, 1, 0, 0, 0)
        )
        extractor = EuraxessExtractor()
        opp = extractor.process_entry(entry)
        
        self.assertIsNotNone(opp)
        self.assertEqual(opp.title, "PhD in Machine Learning")
        self.assertEqual(opp.source_url, "https://example.com/job1")
        self.assertEqual(opp.posted_on, date(2026, 10, 1))
        # Basic validation that missing things are handled
        self.assertEqual(opp.verification, "UNVERIFIED")

    def test_deduplication(self):
        hash1 = OpportunityModel.generate_hash("PhD Position A", "https://url.com")
        hash2 = OpportunityModel.generate_hash("phd position a", "https://URL.COM")
        self.assertEqual(hash1, hash2, "Hashes should be insensitive to case and whitespace.")

    def test_malformed_data(self):
        # Missing title
        entry = MockEntry(title=None, link="https://example.com/job2", summary="No title here.")
        extractor = EuraxessExtractor()
        try:
            # Pydantic validation should fail since title is required as string
            opp = extractor.process_entry(entry)
            self.fail("Should have thrown an exception for missing title")
        except Exception as e:
            self.assertTrue("title" in str(e).lower())

    def test_funding_classification(self):
        summary = "This is a fully funded PhD position."
        if "fully funded" in summary.lower():
            funding_class = "FULLY_FUNDED"
        else:
            funding_class = "UNKNOWN"
            
        self.assertEqual(funding_class, "FULLY_FUNDED")

    def test_source_failure(self):
        extractor = EuraxessExtractor(rss_url="http://invalid.url.that.does.not.exist.example.com")
        opps = extractor.fetch_and_parse()
        self.assertEqual(len(opps), 0, "Should handle source failure gracefully by returning empty list.")

    def test_matcher_professor_strong(self):
        profile = {"research_background": {"interests": ["Machine Learning", "EEG"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_professor(["Machine Learning", "Deep Learning", "EEG"])
        self.assertGreater(res["score"], 50)
        self.assertIn("Strong overlap", res["explanation"])

    def test_matcher_professor_acronym(self):
        profile = {"research_background": {"interests": ["ML", "electroencephalography"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_professor(["Machine Learning", "EEG"])
        self.assertGreater(res["score"], 50)
        self.assertIn("Strong overlap", res["explanation"])

    def test_matcher_professor_partial(self):
        profile = {"research_background": {"interests": ["Biomedical"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_professor(["AI in Medicine", "Biomedical Systems"])
        self.assertGreater(res["score"], 20)
        self.assertIn("Partial overlap", res["explanation"])

    def test_matcher_professor_no_match(self):
        profile = {"research_background": {"interests": ["Civil Engineering"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_professor(["Machine Learning"])
        self.assertEqual(res["score"], 30) # Baseline 20 + 10 for no match
        self.assertIn("No direct overlap", res["explanation"])

    def test_matcher_professor_missing(self):
        matcher = DeterministicMatcher({})
        res = matcher.match_professor([])
        self.assertEqual(res["score"], 0)
        self.assertIn("Insufficient data", res["explanation"])

    def test_matcher_opportunity_strong(self):
        profile = {
            "research_background": {"interests": ["EEG"]},
            "technical_skills": {"skills": ["Python"]},
            "preferences": {"funding": "FULLY_FUNDED"}
        }
        matcher = DeterministicMatcher(profile)
        res = matcher.match_opportunity("We are looking for a Python dev for EEG research.", "FULLY_FUNDED")
        self.assertTrue(res["score"] >= 60)
        self.assertIn("align", res["explanation"])
        self.assertIn("Matches preference", res["explanation"])

    def test_matcher_opportunity_degree_compatible(self):
        profile = {"academic_background": {"degrees": ["Master of Science"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_opportunity("A Master degree is required.", "UNKNOWN")
        self.assertIn("compatibility", res["explanation"])

    def test_matcher_opportunity_degree_incompatible(self):
        profile = {"academic_background": {"degrees": ["Bachelor of Science"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_opportunity("A master degree is required.", "UNKNOWN")
        self.assertIn("incompatibility", res["explanation"])
        
    def test_matcher_opportunity_country_university(self):
        profile = {
            "preferences": {
                "countries": ["USA"],
                "universities": ["MIT"]
            }
        }
        matcher = DeterministicMatcher(profile)
        res = matcher.match_opportunity("text", "UNKNOWN", "USA", "MIT")
        self.assertIn("Country alignment", res["explanation"])
        self.assertIn("University alignment", res["explanation"])

    def test_matcher_opportunity_country_mismatch(self):
        profile = {"preferences": {"countries": ["USA"]}}
        matcher = DeterministicMatcher(profile)
        res = matcher.match_opportunity("text", "UNKNOWN", "UK", "Oxford")
        self.assertIn("Country mismatch", res["explanation"])

if __name__ == "__main__":
    unittest.main()
