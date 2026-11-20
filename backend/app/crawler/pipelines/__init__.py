# backend/app/crawler/pipelines/__init__.py
from app.crawler.pipelines.classification import ClassificationResult, InternshipClassifier
from app.crawler.pipelines.deduplication import DeduplicationPipeline
from app.crawler.pipelines.normalization import EntityNormalizer

__all__ = [
    "ClassificationResult",
    "DeduplicationPipeline",
    "EntityNormalizer",
    "InternshipClassifier",
]
