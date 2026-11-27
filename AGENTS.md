# AGENTS.md

## Documentation language

- All docs under `docs/` and all `README.md` files are written in **English by default** (the original).
- Every English doc under `docs/` must have a Korean copy under `docs/_ko/` with the same relative path and file name (e.g. `docs/project-proposal.md` + `docs/_ko/project-proposal.md`, `docs/compiler-steps/README.md` + `docs/_ko/compiler-steps/README.md`).
- Every `README.md` outside `docs/` must have a Korean file `README.ko.md` next to it (e.g. `web-fe/README.md` + `web-fe/README.ko.md`).
- When changing either file, update both in the same change. Relative links inside `docs/_ko/` stay within `docs/_ko/`.
- This file (`AGENTS.md`) is English only.

## Commit messages

- Format: `<keyword>: <message>`. Keywords: `feat`, `bug`, `refactor`, `docs`, `chore`, `test`, etc.
- Keep the message short (one line, about 70 characters or fewer) and focus on why the change was made rather than listing what changed. Add a body only when the reason is not obvious.
- Commit only when asked. Stage specific paths instead of `git add -A`, so local or unrelated files are not committed. Never skip hooks or amend/force-push shared history unless asked.
- If an AI tool made the change, a `Co-Authored-By` trailer at the end of the message is fine.

## Project

**MiniTikZ2Wasm** — final project for a compiler course. Full proposal: [docs/project-proposal.md](docs/project-proposal.md).

It compiles MiniTikZ (a small subset/modified version of TikZ) into a WebAssembly binary that draws the figure on an HTML Canvas.

## Source language: MiniTikZ

- Commands: `\node`, `\draw`, `\foreach`
- Paths: straight lines (`--`)
- Coordinates: arithmetic expressions or node names
- Expressions: `+ - * /`, parentheses, `sin`, `cos`, `sqrt`, and the `\foreach` loop variable

## Target

- WebAssembly module (`.wasm`) exporting `draw`.
- Imports a few drawing functions (`moveTo`, `lineTo`, `stroke`, …) that wrap the browser Canvas 2D API.

## Compiler pipeline

1. Lexer — source → tokens with source positions
2. Parser — tokens → AST
3. Semantic analysis — AST → type-annotated AST; errors such as `undefined node 'b'`
4. Wasm code generation — AST → `.wasm` binary
5. Browser execution — run the module and draw on a Canvas

## Architecture

- Web page: a text box for MiniTikZ code, a canvas beside it, and a view of each compiler stage below the text box.
- Compiler stages run on a backend server, not in the browser; only the generated Wasm runs in the browser.
- Errors must be reported with line and column positions.

## Folder structure (decided)

Details and open questions: [docs/folder-structure.md](docs/folder-structure.md).

- `mini-tikz-2-wasm/` — pure-Python package (dist `mini-tikz-2-wasm`, import `mini_tikz_2_wasm`, src layout). All compiler logic: `lexer.py`, `parser.py`, `ast_nodes.py`, `symbol_table.py`, `semantic.py`, `codegen.py`, `errors.py`. `STEPS` in `__init__.py` is the ordered list of step functions (`lex`, `parse`, `analyze`, `codegen`). No web dependency. Tests: `pytest` inside the package.
- `web-be/` — FastAPI app. Imports `mini_tikz_2_wasm`, exposes `GET /health`, `GET /api/steps`, and one `POST /api/{step}` per entry in `STEPS` (`lex`, `parse`, `ast`, `analyze`, `codegen`). Body `{"input": ...}` (source for the first step, else the previous step's `output`); response `{"output": ..., "errors": [...]}` straight from the package's `StepResult` (codegen bytes become `{"wasmBase64": ...}`); HTTP 501 for a stub. Holds no compiler logic. Also serves the static files of `web-fe/` at `/` (one origin and port, no CORS; `WEB_FE_DIR` overrides the folder). Run: `uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be`.
- `web-fe/` — plain HTML/CSS/JS (ES modules, no React, no bundler). Calls the backend per step, shows each result, and runs the returned Wasm on the canvas. Example buttons (`js/examples.js`, `{ name, code }`) and steps (`js/steps.js`, `{ name, url, visualizer }`) are data-driven lists. `js/pipeline.js` calls the steps in order with body `{ input }` (previous step's output; the source for the first step) and stops when `errors` is not empty; results are shown by visualizers from `js/visualizers.js` (only `text` for now). Served by the backend; open http://localhost:8000. Wasm import contract: `moveTo(x,y)`, `lineTo(x,y)`, `stroke()`, `fillCircle(x,y,r)` with f64 math coordinates (JS converts to px, y flipped); module exports `draw()`.
- Ownership: compiler logic (`mini-tikz-2-wasm/src/`) is [@6QB6](https://github.com/6QB6)'s; web (`web-fe/`), backend (`web-be/`) and test code are [@BranKein](https://github.com/BranKein)'s. Package-specific rules (including "run the tests before every push"): [mini-tikz-2-wasm/AGENTS.md](mini-tikz-2-wasm/AGENTS.md).
- Dependency direction: `web-fe` → HTTP → `web-be` → import → `mini-tikz-2-wasm`. Keep compiler logic out of `web-be` and `web-fe`.
- Tooling: `uv` workspace at the repo root (`pyproject.toml`, members `mini-tikz-2-wasm` and `web-be`), Python 3.11+. Setup: `uv sync --all-packages`; tests: `uv run --package <name> pytest`. Docker: `docker compose up --build` (`web-be/Dockerfile`, build context = repo root).
- Adding a compiler step: add the module/function in the package, register it in `STEPS`, add an entry to `web-fe/js/steps.js` (`name`, `url`, `visualizer`), and add its folder under `docs/compiler-steps/`.

## Reference test program

```
\begin{tikzpicture}
  \node (A) at (0,0) {};
  \node (B) at (0,2) {};
  \draw (A) -- (B);
  \foreach \i in {1,...,3} {
    \draw (\i, 0) -- (\i, {1 + cos(60)});
  }
\end{tikzpicture}
```

Expected render: four vertical lines at x = 0, 1, 2, 3, with black dots at both endpoints of the line at x = 0.

## Course constraints

See [docs/project-notes.md](docs/project-notes.md). Key points: write RE before CFG; recover from syntax errors and keep compiling; show at least 2 error kinds (syntax, undefined node, division by zero, including constant expressions like 1/(2-2)); show parse tree and AST; a simple symbol table (BST allowed) is recommended.

## Demo web design

Layout sketch for the presentation demo (input box, example buttons, canvas, per-step result boxes, one backend API per compiler step): [docs/demo-web-design.md](docs/demo-web-design.md). Several details are still undecided; see its last section. The example-input buttons and the compiler steps are both undecided and must be built extensible (data-driven lists) so more can be added later.

## Compiler step docs

Each compiler step has its own folder under [docs/compiler-steps/](docs/compiler-steps/README.md). A step folder holds a `README.md` (what the step does, input, output, errors, API) and a `cases/` folder of example/test cases, one folder per case with `input.*` and `expected.json` (plus optional `case.md`). The compiler-steps README holds the common rules, the case structure and the step list; start a new step by copying [docs/compiler-steps/_template/](docs/compiler-steps/_template/). The set of steps is not decided yet.

## Notes

- More project details will be added as the course requirements are clarified.
