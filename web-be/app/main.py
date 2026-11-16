"""FastAPI facade for the compiler stages."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from mini_tikz_2_wasm import CompileError, STEPS

app = FastAPI(title="MiniTikZ2Wasm backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class StepRequest(BaseModel):
    source: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/steps")
def steps():
    return {"steps": [name for name, _ in STEPS]}


def make_step_handler(target_name, target_fn):
    def handler(request: StepRequest):
        value = request.source
        try:
            for name, fn in STEPS:
                value = fn(value)
                if name == target_name:
                    break
        except NotImplementedError as error:
            return JSONResponse(
                status_code=501,
                content={"ok": False, "error": f"step '{target_name}' not implemented yet"},
            )
        except CompileError as error:
            return {"ok": False, "diagnostics": [item.to_dict() for item in error.diagnostics]}
        # A future codegen byte result must be base64-encoded for JSON.
        return {"ok": True, "result": value}

    return handler


for step_name, step_fn in STEPS:
    app.post(f"/api/{step_name}")(make_step_handler(step_name, step_fn))
