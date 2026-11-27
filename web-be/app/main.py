"""FastAPI facade for the compiler stages.

One `POST /api/{step}` per entry in `STEPS`. The body is `{"input": ...}` (the source for the first
step, the previous step's `output` for the others); the response is the step's
`{"output": ..., "errors": [...]}`. The backend only calls the package function.
"""

import base64
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from mini_tikz_2_wasm import STEPS

app = FastAPI(title="MiniTikZ2Wasm backend")


class StepRequest(BaseModel):
    input: Any = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/steps")
def steps():
    return {"steps": [name for name, _ in STEPS]}


def make_step_handler(step_name, step_fn):
    def handler(request: StepRequest):
        try:
            result = step_fn(request.input)
        except NotImplementedError:
            return JSONResponse(
                status_code=501,
                content={"error": f"step '{step_name}' not implemented yet"},
            )
        body = result.to_dict()
        if isinstance(body["output"], bytes):
            # Wasm bytes cannot go into JSON as is.
            body["output"] = {"wasmBase64": base64.b64encode(body["output"]).decode("ascii")}
        return body

    return handler


for step_name, step_fn in STEPS:
    app.post(f"/api/{step_name}")(make_step_handler(step_name, step_fn))


FE_DIR = Path(os.environ.get("WEB_FE_DIR", Path(__file__).resolve().parents[2] / "web-fe"))
if FE_DIR.is_dir():
    app.mount("/", StaticFiles(directory=FE_DIR, html=True), name="web-fe")
