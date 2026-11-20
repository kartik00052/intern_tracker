# backend/tests/api/test_routes.py
from app.main import app


def test_routes_registered_in_openapi() -> None:
    """Verify that health and internships routes are registered on the application schema."""
    schema = app.openapi()
    paths = schema.get("paths", {})

    assert "/api/v1/health" in paths
    assert "/api/v1/internships" in paths
    assert "/api/v1/internships/{internship_id}" in paths

    # Verify query parameters for /api/v1/internships
    internship_params = [
        param["name"] for param in paths["/api/v1/internships"]["get"].get("parameters", [])
    ]
    assert "q" in internship_params
    assert "location" in internship_params
    assert "remote" in internship_params
    assert "country" in internship_params
    assert "stipend" in internship_params
    assert "page" in internship_params
    assert "page_size" in internship_params


def test_cors_configuration() -> None:
    """Verify CORS middleware is configured."""
    middleware_names = [m.cls.__name__ for m in app.user_middleware]
    assert "CORSMiddleware" in middleware_names
