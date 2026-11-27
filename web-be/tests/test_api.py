from fastapi.testclient import TestClient

from app.main import StepRequest, app, make_step_handler
from mini_tikz_2_wasm import Diagnostic, StepResult

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_steps():
    response = client.get("/api/steps")
    assert response.status_code == 200
    assert response.json() == {"steps": ["lex", "parse", "ast", "analyze", "codegen"]}


def test_lex_stub():
    response = client.post("/api/lex", json={"input": "x"})
    assert response.status_code == 501


def test_every_step_has_an_endpoint():
    for name in ["lex", "parse", "ast", "analyze", "codegen"]:
        assert client.post(f"/api/{name}", json={"input": "x"}).status_code == 501


def test_handler_returns_output_and_errors():
    handler = make_step_handler("fake", lambda value: StepResult([value], [Diagnostic("syntax", "m", 1, 2)]))
    assert handler(StepRequest(input="a")) == {
        "output": ["a"],
        "errors": [{"kind": "syntax", "message": "m", "line": 1, "column": 2}],
    }


def test_handler_base64_encodes_bytes():
    handler = make_step_handler("fake", lambda value: StepResult(b"\x00asm"))
    assert handler(StepRequest(input={})) == {"output": {"wasmBase64": "AGFzbQ=="}, "errors": []}


def test_serves_front_end():
    response = client.get("/")
    assert response.status_code == 200
    assert "MiniTikZ2Wasm" in response.text

    response = client.get("/js/main.js")
    assert response.status_code == 200
