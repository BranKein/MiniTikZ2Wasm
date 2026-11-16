from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_steps():
    response = client.get("/api/steps")
    assert response.status_code == 200
    assert response.json() == {"steps": ["lex", "parse", "analyze", "codegen"]}


def test_lex_stub():
    response = client.post("/api/lex", json={"source": "x"})
    assert response.status_code == 501
