# MiniTikZ2Wasm

A compiler-course project. It compiles **MiniTikZ** (a small subset and modified version of TikZ) into a **WebAssembly** binary that draws the figure on an HTML Canvas.

Korean version: [README.ko.md](README.ko.md)

> Status: early scaffolding stage. The folder structure is decided; the compiler steps are still under discussion.

## Example

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

## How it works

1. The user types MiniTikZ code on a web page.
2. A Python backend runs each compiler stage (lexer, parser, semantic analysis, Wasm code generation) and the page shows every stage's result.
3. The generated `.wasm` runs in the browser and draws on the canvas. Errors are reported with line and column positions.

## Repository layout

| Folder | What it is |
|---|---|
| [`mini-tikz-2-wasm/`](mini-tikz-2-wasm/README.md) | The compiler as a pure-Python package |
| [`web-be/`](web-be/README.md) | FastAPI backend: one API per compiler step; also serves the front end |
| [`web-fe/`](web-fe/README.md) | Plain HTML/CSS/JS front end (no framework, no bundler) |
| [`docs/`](docs/) | Proposal, notes, demo design, compiler step docs |

Details and open questions: [docs/folder-structure.md](docs/folder-structure.md).

## Getting started

Requires [uv](https://docs.astral.sh/uv/) (Python 3.11+) or Docker.

```sh
# with uv, from the repository root
uv sync --all-packages
uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be
# open http://localhost:8000

# or with Docker
docker compose up --build
```

Run the tests:

```sh
uv run --package mini-tikz-2-wasm pytest
uv run --package web-be pytest
```

## Docs

- [Project proposal](docs/project-proposal.md)
- [Project notes (course constraints)](docs/project-notes.md)
- [Demo web design](docs/demo-web-design.md)
- [Folder structure](docs/folder-structure.md)
- [Compiler steps](docs/compiler-steps/README.md) and [step proposal](docs/compiler-steps/proposal.md)

## Contributing

- Compiler logic: [@6QB6](https://github.com/6QB6). Web, backend and tests: [@BranKein](https://github.com/BranKein).
- Run the tests before every push.
- Contributor and agent rules: [AGENTS.md](AGENTS.md).
