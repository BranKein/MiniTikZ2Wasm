# Folder Structure Proposal

> Status: **proposal (under discussion)**. Not yet agreed with the teammate. Once agreed, update the status here, and update [AGENTS.md](../AGENTS.md) whenever it changes. Korean version: [folder-structure.ko.md](folder-structure.ko.md).

## One-line summary

Split the project into three folders. The compiler logic lives in a standalone Python package (`mini-tikz-2-wasm`); the backend (`web-be`, FastAPI) imports that package and exposes per-step APIs; the front end (`web-fe`, plain HTML/JS) calls those APIs and shows the results.

```
MiniTikZ2Wasm/
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
│   ├── app/main.py            # per-step POST /api/{step}
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
- CORS: during development the front end (`localhost:5173`) calls the backend (`localhost:8000`), so it is allowed.

### `web-fe/` — front end

- Static HTML/CSS/JS (ES modules), no React. No bundler, no npm. Serve with `python3 -m http.server 5173`.
- The layout follows the design in [demo-web-design.md](demo-web-design.md) (input box, example buttons, canvas, per-step result boxes).
- The two lists that must be extensible are kept as data: example buttons (`js/examples.js`) and compiler steps (`js/steps.js`). Adding an entry grows the UI automatically.
- `js/canvas.js` wraps the drawing functions the Wasm imports (`moveTo`, `lineTo`, `stroke`, …) around the Canvas 2D API. The import names are a proposal and must be agreed with whoever does code generation.

## Local development flow

```
# 1) install the compiler package and the backend (inside a virtualenv)
pip install -e ./mini-tikz-2-wasm[dev]
pip install -e ./web-be[dev]

# 2) run the backend (:8000)
cd web-be && uvicorn app.main:app --reload --port 8000

# 3) run the front end (:5173)
cd web-fe && python3 -m http.server 5173
```

The package is installed in editable mode, so compiler changes show up immediately under the backend's `--reload`.

## Why split it this way / pros and cons

- Pros
  - Compiler logic is separate from the web, which makes unit testing and splitting work among teammates (compiler / backend / front end) easy.
  - The "per-step API" structure of the presentation is visible in the code as well.
  - The front end has no build step, so it stays light.
- Cons / caveats
  - Three folders must be installed and run separately (see the flow above).
  - The backend re-runs the step functions as a chain, so more steps can mean repeated work. We favor simplicity at first.

## Open questions (to discuss)

1. Are the folder names and the package name (`mini-tikz-2-wasm` / `mini_tikz_2_wasm`) fine?
2. Should the backend also serve the front end's static files (one port), or stay separate as now (needs CORS)?
3. Fix the compiler step list: besides `lex / parse / analyze / codegen`, should parse tree output and symbol table output be separate steps? (See [compiler-steps/proposal.md](compiler-steps/proposal.md).)
4. Names and signatures of the Wasm import functions.
5. Package tooling: currently `pip` + `pyproject.toml`. Use `uv` or similar?
6. Minimum Python version (currently assumed 3.10+).
