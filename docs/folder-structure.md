# Folder Structure Proposal

> Status: **proposal (under discussion)**. Not yet agreed with the teammate. Once agreed, update the status here, and update [AGENTS.md](../AGENTS.md) whenever it changes. Korean version: [_ko/folder-structure.md](_ko/folder-structure.md).

## One-line summary

Split the project into three folders. The compiler logic lives in a standalone Python package (`mini-tikz-2-wasm`); the backend (`web-be`, FastAPI) imports that package and exposes per-step APIs; the front end (`web-fe`, plain HTML/JS) calls those APIs and shows the results.

```
MiniTikZ2Wasm/
├── pyproject.toml             # uv workspace root (members: mini-tikz-2-wasm, web-be)
├── docker-compose.yml         # one service: backend + static front end
├── docs/                      # planning and design docs
├── mini-tikz-2-wasm/          # compiler (Python package)
│   ├── pyproject.toml
│   ├── src/mini_tikz_2_wasm/
│   │   ├── __init__.py        # STEPS list and public API
│   │   ├── errors.py          # Diagnostic(kind, message, line, column), CompileError
│   │   ├── lexer.py           # lex(source) -> tokens
│   │   ├── parser.py          # parse(tokens) -> AST
│   │   ├── ast_nodes.py       # AST node definitions
│   │   ├── symbol_table.py    # symbol table (BST allowed)
│   │   ├── semantic.py        # analyze(ast) -> type-annotated AST
│   │   └── codegen.py         # codegen(ast) -> .wasm bytes
│   └── tests/
├── web-be/                    # backend (FastAPI)
│   ├── pyproject.toml
│   ├── Dockerfile             # build context is the repo root
│   ├── app/main.py            # per-step POST /api/{step} + serves web-fe
│   └── tests/
└── web-fe/                    # front end (HTML/CSS/JS, no build tool)
    ├── index.html
    ├── css/style.css
    └── js/                    # main, api, canvas, steps, examples, config
```

## Dependency direction

```
web-fe  --HTTP(JSON)-->  web-be  --import-->  mini-tikz-2-wasm
(browser)                (FastAPI)             (pure Python)
   ▲                                                │
   └──────── receives the .wasm, runs it on Canvas ◄┘
```

- `mini-tikz-2-wasm` knows nothing about the web. It has no external dependencies such as FastAPI.
- `web-be` holds no compiler logic; it only calls the package and wraps results as JSON.
- `web-fe` does not compile. It draws the per-step results it receives and runs only the final Wasm in the browser. (Same as the architecture principle in [AGENTS.md](../AGENTS.md).)

## Role of each folder

### `mini-tikz-2-wasm/` — compiler package

- Distribution name `mini-tikz-2-wasm`, import name `mini_tikz_2_wasm` (src layout).
- One module and one function per compiler step: `lex`, `parse`, `analyze`, `codegen`.
- `STEPS` is the ordered list `[("lex", lex), ("parse", parse), ...]`. The backend loops over it to create endpoints. **Because the steps are not final**, adding or removing a step should only need a change to this list.
- Errors are collected as `Diagnostic(kind, message, line, column)`. Collecting several at once supports the "recover from syntax errors and keep compiling" requirement.
- Per-step input/output/error/case docs live in [compiler-steps/](compiler-steps/README.md). Keep step names the same in code and in docs.
- Tests live inside this package (`tests/`) and run with `pytest`. The compiler can be verified without the web.

### `web-be/` — backend

- A FastAPI app. It imports `mini-tikz-2-wasm` as a dependency.
- Endpoints
  - `GET /health`
  - `GET /api/steps` — list of step names (the front end may use it to build step boxes)
  - `POST /api/{step}` — body `{"source": "..."}`. Returns the result of running from the source up to that step. (Matches "one backend API per step" in [demo-web-design.md](demo-web-design.md).)
- Response convention (proposal)
  - Success: `{"ok": true, "result": ...}`
  - Compile error: HTTP 200, `{"ok": false, "diagnostics": [{kind, message, line, column}, ...]}`
  - Unimplemented step: HTTP 501 (scaffold state)
- The code generation result (bytes) will be base64-encoded to fit in JSON (`result_base64`).
- Static files: the backend also serves `web-fe/` at `/` (FastAPI `StaticFiles`, mounted after the API routes). Front end and API share one origin and one port (8000), so no CORS setup is needed. The folder can be overridden with the `WEB_FE_DIR` environment variable.
- Docker: `web-be/Dockerfile` (build context = repo root) and `docker-compose.yml` run the backend plus the static front end as one container.

### `web-fe/` — front end

- Static HTML/CSS/JS (ES modules), no React. No bundler, no npm. Served by the backend (no separate server); API calls use relative paths.
- The layout follows the design in [demo-web-design.md](demo-web-design.md) (input box, example buttons, canvas, per-step result boxes).
- The two lists that must be extensible are kept as data: example buttons (`js/examples.js`) and compiler steps (`js/steps.js`). Adding an entry grows the UI automatically.
- `js/canvas.js` wraps the drawing functions the Wasm imports (`moveTo`, `lineTo`, `stroke`, …) around the Canvas 2D API. See "Decisions" below for the import contract.

## Local development flow

```
# from the repo root
uv sync --all-packages                 # install both packages + dev tools
uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be
# open http://localhost:8000          (API + front end)

uv run --package mini-tikz-2-wasm pytest   # compiler tests
uv run --package web-be pytest             # backend tests

# or with Docker
docker compose up --build
```

Workspace members are installed in editable mode, so compiler changes show up immediately under the backend's `--reload`.

## Why split it this way / pros and cons

- Pros
  - Compiler logic is separate from the web, which makes unit testing and splitting work among teammates (compiler / backend / front end) easy.
  - The "per-step API" structure of the presentation is visible in the code as well.
  - The front end has no build step, so it stays light.
- Cons / caveats
  - Two Python packages plus a front end folder; the uv workspace and Docker hide most of that, but it is more moving parts than one app.
  - The backend re-runs the step functions as a chain, so more steps can mean repeated work. We favor simplicity at first.

## Decisions (proposed by the author; still to confirm with the teammate)

1. **Names:** keep `mini-tikz-2-wasm` (folder / distribution) and `mini_tikz_2_wasm` (import).
2. **Serving:** keep the project folders separate, but the backend serves the static files of `web-fe/` (one origin, one port, no CORS). Docker and docker compose are provided.
3. **Wasm imports:** `moveTo(x, y)`, `lineTo(x, y)`, `stroke()`, `fillCircle(x, y, r)`. Coordinates are f64 math coordinates; the JavaScript host converts them to canvas pixels (y axis flipped, scaled). `r` is in pixels. The module exports `draw()`.
4. **Tooling:** `uv` with a workspace at the repo root.
5. **Python:** 3.11 or newer.

## Open questions (to discuss)

1. **Compiler step list.** Leaning toward 6 steps (`lex / parse / ast / analyze / codegen` plus browser execution), but this is decided together with the step discussion in [compiler-steps/proposal.md](compiler-steps/proposal.md). The scaffold's 4 steps (`lex / parse / analyze / codegen`) are placeholders until then.
