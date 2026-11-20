# backend/app/crawler/pipelines/classification.py
from dataclasses import dataclass, field
import re
from typing import List, Optional


@dataclass
class ClassificationResult:
    """Outcome of rule-based internship classification."""

    is_internship: bool
    confidence: float
    role_category: str
    matched_rules: List[str] = field(default_factory=list)


class InternshipClassifier:
    """Deterministic, rule-based classifier detecting internship roles without LLM overhead."""

    # Negative exclusion patterns (disqualifies role immediately)
    NEGATIVE_PATTERNS = [
        re.compile(r"\binternal\b", re.IGNORECASE),
        re.compile(r"\binternational\b", re.IGNORECASE),
        re.compile(r"\binternet\b", re.IGNORECASE),
        re.compile(r"\bsenior\b", re.IGNORECASE),
        re.compile(r"\bsr\.\b", re.IGNORECASE),
        re.compile(r"\bprincipal\b", re.IGNORECASE),
        re.compile(r"\bstaff\b", re.IGNORECASE),
        re.compile(r"\bdirector\b", re.IGNORECASE),
        re.compile(r"\bvp\b", re.IGNORECASE),
        re.compile(r"\bhead of\b", re.IGNORECASE),
        re.compile(r"\btenured\b", re.IGNORECASE),
        re.compile(r"\bpostdoc\b", re.IGNORECASE),
        re.compile(r"\bmanager\s*(of|[,–\-])\s*intern", re.IGNORECASE),
        re.compile(r"\bmanager(?!\s+intern)\b", re.IGNORECASE),
    ]

    # Positive internship triggers
    POSITIVE_PATTERNS = [
        (re.compile(r"\binternship\b", re.IGNORECASE), "keyword_internship", 0.98),
        (re.compile(r"\bintern\b", re.IGNORECASE), "keyword_intern", 0.95),
        (re.compile(r"\bco-?op\b", re.IGNORECASE), "keyword_coop", 0.95),
        (re.compile(r"\bfellowship\b", re.IGNORECASE), "keyword_fellowship", 0.90),
        (re.compile(r"\bfellow\b", re.IGNORECASE), "keyword_fellow", 0.85),
        (re.compile(r"\bapprentice(ship)?\b", re.IGNORECASE), "keyword_apprentice", 0.92),
        (re.compile(r"\bundergrad(uate)?\s+intern\b", re.IGNORECASE), "keyword_undergrad_intern", 0.99),
        (re.compile(r"\bstudent\s+(intern|researcher|worker)\b", re.IGNORECASE), "keyword_student", 0.95),
        (re.compile(r"\bgraduate\s+intern\b", re.IGNORECASE), "keyword_grad_intern", 0.98),
        (re.compile(r"\bsummer\s+\d{4}\b", re.IGNORECASE), "keyword_summer_cohort", 0.75),
    ]

    # Category matching rules
    CATEGORY_PATTERNS = [
        (
            "Software Engineering",
            re.compile(
                r"\b(software|swe|developer|backend|frontend|fullstack|systems|infrastructure|mobile|ios|android|embedded|firmware|devops|sre|cloud|web)\b",
                re.IGNORECASE,
            ),
        ),
        (
            "Data Science & AI",
            re.compile(
                r"\b(data scientist|data science|data engineer|machine learning|ml|ai|deep learning|computer vision|nlp|analytics|statistician)\b",
                re.IGNORECASE,
            ),
        ),
        (
            "Product Management",
            re.compile(r"\b(product manager|product management|pm intern|associate product)\b", re.IGNORECASE),
        ),
        (
            "Design & UX",
            re.compile(r"\b(product design|ux|ui|user research|interaction design|graphic design|creative)\b", re.IGNORECASE),
        ),
        (
            "Hardware Engineering",
            re.compile(r"\b(hardware|electrical|asic|fpga|silicon|rf|pcb|mechanical|thermal)\b", re.IGNORECASE),
        ),
        (
            "Security & Cryptography",
            re.compile(r"\b(cybersecurity|cyber|security|infosec|cryptography|penetration|appsec)\b", re.IGNORECASE),
        ),
        (
            "Business & Operations",
            re.compile(r"\b(business operations|strategy|finance|accounting|consulting|marketing|sales|talent|hr|recruiting)\b", re.IGNORECASE),
        ),
    ]

    def classify(self, title: str, description_text: Optional[str] = None) -> ClassificationResult:
        """Classify a title and optional text as an internship or non-internship."""
        matched_rules: List[str] = []

        # 1. Check for negative disqualifications first
        for neg_pat in self.NEGATIVE_PATTERNS:
            if neg_pat.search(title):
                return ClassificationResult(
                    is_internship=False,
                    confidence=0.0,
                    role_category="Excluded",
                    matched_rules=[f"negative_exclusion_{neg_pat.pattern}"],
                )

        # 2. Match positive indicators in title
        best_confidence = 0.0
        for pos_pat, rule_name, conf in self.POSITIVE_PATTERNS:
            if pos_pat.search(title):
                matched_rules.append(rule_name)
                if conf > best_confidence:
                    best_confidence = conf

        # 3. If title matches positive rule, mark as internship
        is_internship = len(matched_rules) > 0 and best_confidence >= 0.85

        if not is_internship:
            return ClassificationResult(
                is_internship=False,
                confidence=0.0,
                role_category="Excluded",
                matched_rules=matched_rules,
            )

        # 4. Determine functional role category
        role_category = "General"
        combined_text = f"{title} {description_text[:500] if description_text else ''}"
        for category, cat_pat in self.CATEGORY_PATTERNS:
            if cat_pat.search(combined_text):
                role_category = category
                break

        return ClassificationResult(
            is_internship=True,
            confidence=best_confidence,
            role_category=role_category,
            matched_rules=matched_rules,
        )
