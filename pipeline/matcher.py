import json
import hashlib
import re

class DeterministicMatcher:
    def __init__(self, user_profile: dict):
        self.profile = user_profile
        self.synonyms = {
            "ml": "machine learning",
            "ai": "artificial intelligence",
            "eeg": "electroencephalography",
            "nlp": "natural language processing",
            "cv": "computer vision",
            "bci": "brain computer interface"
        }
        
    def normalize(self, text: str) -> str:
        text = text.lower()
        for k, v in self.synonyms.items():
            # word boundary replacement
            text = re.sub(r'\b' + re.escape(k) + r'\b', v, text)
        return text

    def match_professor(self, professor_topics: list) -> dict:
        """Score a professor based on research topic overlap with the user's interests."""
        score = 0
        topic_overlap = 0
        profile_fit = 0
        
        reasons = []
        
        user_interests = self.profile.get("research_background", {}).get("interests", [])
        
        if not user_interests or not professor_topics:
            return {
                "score": 0, 
                "explanation": "Insufficient data for match.",
                "fit_breakdown": {"topic_overlap": 0, "profile_fit": 0, "research_recency": 0, "recruiting_signal": 0}
            }
            
        user_interests_norm = [self.normalize(i) for i in user_interests]
        prof_topics_norm = [self.normalize(t) for t in professor_topics]
        
        matches = set(user_interests_norm).intersection(set(prof_topics_norm))
        
        if matches:
            topic_overlap = min(len(matches) * 5, 10)
            profile_fit = 8
            score += min(len(matches) * 20, 80)
            reasons.append(f"Strong overlap in research areas: {', '.join(matches).title()}.")
        else:
            partial = []
            for pt in prof_topics_norm:
                for ui in user_interests_norm:
                    pt_tokens = set(pt.split())
                    ui_tokens = set(ui.split())
                    if pt_tokens.intersection(ui_tokens):
                        partial.append(pt)
            
            if partial:
                topic_overlap = min(len(set(partial)) * 3, 7)
                profile_fit = 5
                score += min(len(set(partial)) * 10, 50)
                reasons.append(f"Partial overlap in research topics: {', '.join(set(partial)).title()}.")
            else:
                topic_overlap = 0
                profile_fit = 2
                score += 10
                reasons.append("No direct overlap in stated research areas.")
                
        final_score = min(score + 20, 100) # Baseline 20
        
        return {
            "score": final_score,
            "explanation": "\n".join(reasons),
            "fit_breakdown": {
                "topic_overlap": topic_overlap,
                "profile_fit": profile_fit,
                "research_recency": 5, 
                "recruiting_signal": 0
            }
        }

    def match_opportunity(self, opp_text: str, opp_funding: str, opp_country: str = None, opp_university: str = None) -> dict:
        """Score an opportunity against user profile."""
        score = 0
        funding_fit = 0
        eligibility_fit = 0
        topic_overlap = 0
        institution_fit = 0
        reasons = []
        
        text_norm = self.normalize(opp_text) if opp_text else ""
        
        # Technical skills
        skills = self.profile.get("technical_skills", {}).get("skills", [])
        matched_skills = [s for s in skills if self.normalize(s) in text_norm]
        
        if matched_skills:
            eligibility_fit = min(len(matched_skills) * 3, 5)
            score += min(len(matched_skills) * 10, 20)
            reasons.append(f"Profile technical skills align: {', '.join(matched_skills)}.")
        else:
            reasons.append("No technical skill overlap found.")
            
        # Academic Background / Degree Compatibility
        degrees = self.profile.get("academic_background", {}).get("degrees", [])
        degree_text = " ".join([d.lower() for d in degrees])
        if "master" in text_norm and "master" not in degree_text and "ms" not in degree_text:
            reasons.append("Potential degree incompatibility: opportunity mentions 'master' but profile lacks it.")
            eligibility_fit = max(0, eligibility_fit - 2)
        elif "master" in text_norm and ("master" in degree_text or "ms" in degree_text):
            reasons.append("Degree compatibility: Profile has Master's degree.")
            eligibility_fit = min(eligibility_fit + 5, 10)
            score += 10
            
        # Funding preference
        pref_funding = self.profile.get("preferences", {}).get("funding", "FULLY_FUNDED")
        if not opp_funding or opp_funding == "UNKNOWN":
            funding_fit = 3
            score += 10
            reasons.append("Funding information is UNKNOWN.")
        elif pref_funding == opp_funding:
            funding_fit = 10
            score += 20
            reasons.append(f"Funding alignment: Matches preference for {pref_funding}.")
        else:
            reasons.append(f"Funding mismatch: Opportunity provides {opp_funding}, preferred {pref_funding}.")

        # Country Preference
        pref_countries = self.profile.get("preferences", {}).get("countries", [])
        if opp_country:
            if opp_country in pref_countries:
                score += 15
                institution_fit += 5
                reasons.append(f"Country alignment: {opp_country} is preferred.")
            elif pref_countries:
                reasons.append(f"Country mismatch: {opp_country} is not in preferred list.")
                
        # University Preference
        pref_unis = self.profile.get("preferences", {}).get("universities", [])
        if opp_university:
            if opp_university in pref_unis:
                score += 15
                institution_fit += 5
                reasons.append(f"University alignment: {opp_university} is preferred.")
            
        # Research overlap in text
        interests = self.profile.get("research_background", {}).get("interests", [])
        matched_interests = [i for i in interests if self.normalize(i) in text_norm]
        
        if matched_interests:
            topic_overlap = min(len(matched_interests) * 5, 10)
            score += min(len(matched_interests) * 20, 40)
            reasons.append(f"Research focus aligns: {', '.join(matched_interests)}.")
            
        final_score = min(score + 10, 100) # Baseline 10
        
        return {
            "score": final_score,
            "explanation": "\n".join(reasons),
            "fit_breakdown": {
                "topic_overlap": topic_overlap,
                "funding_fit": funding_fit,
                "eligibility_fit": eligibility_fit,
                "institution_fit": institution_fit
            }
        }
