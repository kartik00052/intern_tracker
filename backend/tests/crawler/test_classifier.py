# backend/tests/crawler/test_classifier.py
import pytest
from app.crawler.pipelines.classification import InternshipClassifier


@pytest.fixture
def classifier() -> InternshipClassifier:
    return InternshipClassifier()


def test_positive_internship_titles(classifier: InternshipClassifier) -> None:
    """Validate that standard internship indicators are recognized with high confidence."""
    test_cases = [
        ("Software Engineering Intern", "Software Engineering"),
        ("Summer 2026 Data Science Internship", "Data Science & AI"),
        ("Hardware Engineering Co-op (Fall 2026)", "Hardware Engineering"),
        ("Product Design Fellow", "Design & UX"),
        ("Associate Product Manager Intern", "Product Management"),
        ("Cybersecurity Apprentice", "Security & Cryptography"),
        ("Undergraduate Research Intern", "General"),
        ("Student Worker - Machine Learning", "Data Science & AI"),
    ]

    for title, expected_category in test_cases:
        res = classifier.classify(title)
        assert res.is_internship is True, f"Failed to classify '{title}' as internship"
        assert res.confidence >= 0.85
        assert res.role_category == expected_category, f"Expected {expected_category}, got {res.role_category} for {title}"


def test_negative_exclusion_titles(classifier: InternshipClassifier) -> None:
    """Validate that experienced, leadership, or false positive keywords are strictly excluded."""
    non_intern_cases = [
        "Senior Software Engineer",
        "Staff Backend Engineer",
        "Engineering Director",
        "VP of Engineering",
        "Product Manager",
        "Internal Communications Manager",  # Contains "internal"
        "International Business Analyst",   # Contains "international"
        "Internet Systems Architect",       # Contains "internet"
        "Head of Design",
        "Principal Machine Learning Researcher",
        "Lead DevOps Engineer",
        "Tenured Research Scientist",
    ]

    for title in non_intern_cases:
        res = classifier.classify(title)
        assert res.is_internship is False, f"Erroneously classified '{title}' as an internship"
        assert res.confidence == 0.0
        assert res.role_category == "Excluded"


def test_internship_with_leading_or_trailing_modifiers(classifier: InternshipClassifier) -> None:
    """Verify robust recognition of complex titles."""
    res = classifier.classify("2026 Summer - Software Engineering Intern (Backend Infrastructure)")
    assert res.is_internship is True
    assert res.role_category == "Software Engineering"
    assert "keyword_intern" in res.matched_rules
