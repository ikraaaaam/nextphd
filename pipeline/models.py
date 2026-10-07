import os
import hashlib
from typing import Optional, List, Any
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime, date

class OpportunityModel(BaseModel):
    hash: str
    title: str
    country: Optional[str] = None
    field: Optional[str] = None
    source: str
    source_url: str
    official_url: Optional[str] = None
    posted_on: Optional[date] = None
    deadline: Optional[date] = None
    rolling_admission: bool = False
    funding_text: Optional[str] = None
    stipend_amount: Optional[str] = None
    tuition_covered: Optional[bool] = None
    funding_class: Optional[str] = None
    eligibility: Optional[str] = None
    english_req: Optional[str] = None
    dependents_note: Optional[str] = None
    verification: str = "UNVERIFIED"
    status: str = "NEW"
    notes: Optional[str] = None

    @classmethod
    def generate_hash(cls, title: str, source_url: str) -> str:
        # A simple hashing strategy for deduplication
        raw = f"{title.strip().lower()}|{source_url.strip().lower()}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()

class UniversityModel(BaseModel):
    name: str
    country: Optional[str] = None
    city: Optional[str] = None
    openalex_id: Optional[str] = None
    website: Optional[str] = None
    verified: bool = False
    source_url: Optional[str] = None
    works_count: Optional[int] = None
    cited_by_count: Optional[int] = None

class ProfessorModel(BaseModel):
    name: str
    university_name: Optional[str] = None
    openalex_author_id: Optional[str] = None
    homepage: Optional[str] = None
    department: Optional[str] = None
    h_index: Optional[int] = None
    works_count: Optional[int] = None
    cited_by_count: Optional[int] = None
    recent_topics: List[str] = []
    recent_papers: List[dict] = []
