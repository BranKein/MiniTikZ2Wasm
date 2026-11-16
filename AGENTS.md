# AGENTS.md

## Documentation language

- All docs under `docs/` and all `README.md` files are written in **English by default** (the original).
- Every `X.md` in `docs/` and every `README.md` must have a paired Korean file `X.ko.md` (e.g. `docs/project-proposal.md` + `docs/project-proposal.ko.md`, `web-fe/README.md` + `web-fe/README.ko.md`).
- When changing either file, update both in the same change. Links inside a `.ko.md` file point to the `.ko.md` version of the target.
- This file (`AGENTS.md`) is English only.

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

## Folder structure (proposal, not yet agreed with the teammate)

Details and open questions: [docs/folder-structure.md](docs/folder-structure.md).

- `mini-tikz-2-wasm/` — pure-Python package (dist `mini-tikz-2-wasm`, import `mini_tikz_2_wasm`, src layout). All compiler logic: `lexer.py`, `parser.py`, `ast_nodes.py`, `symbol_table.py`, `semantic.py`, `codegen.py`, `errors.py`. `STEPS` in `__init__.py` is the ordered list of step functions (`lex`, `parse`, `analyze`, `codegen`). No web dependency. Tests: `pytest` inside the package.
- `web-be/` — FastAPI app. Imports `mini_tikz_2_wasm`, exposes `GET /health`, `GET /api/steps`, and one `POST /api/{step}` per entry in `STEPS` (body `{"source": ...}`). Holds no compiler logic. Run: `uvicorn app.main:app --reload --port 8000`.
- `web-fe/` — plain HTML/CSS/JS (ES modules, no React, no bundler). Calls the backend per step, shows each result, and runs the returned Wasm on the canvas. Example buttons (`js/examples.js`) and steps (`js/steps.js`) are data-driven lists. Serve: `python3 -m http.server 5173`.
- Dependency direction: `web-fe` → HTTP → `web-be` → import → `mini-tikz-2-wasm`. Keep compiler logic out of `web-be` and `web-fe`.
- Local setup: `pip install -e ./mini-tikz-2-wasm[dev]` then `pip install -e ./web-be[dev]`.
- Adding a compiler step: add the module/function in the package, register it in `STEPS`, add it to `web-fe/js/steps.js`, and add its folder under `docs/compiler-steps/`.

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
