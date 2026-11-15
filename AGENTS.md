# AGENTS.md

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
4. Wasm code generation — (optimized) AST → `.wasm` binary
5. Browser execution — run the module and draw on a Canvas

## Architecture

- Web page: a text box for MiniTikZ code, a canvas beside it, and a view of each compiler stage below the text box.
- Compiler stages run on a backend server, not in the browser; only the generated Wasm runs in the browser.
- Errors must be reported with line and column positions.

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

See [docs/project-notes.md](docs/project-notes.md). Key points: write RE before CFG; recover from syntax errors and keep compiling; show at least 2 error kinds (syntax, undefined node, division by zero); show parse tree and AST; constant folding needs multiple AST passes; a simple symbol table (BST allowed) is recommended.

## Notes

- More project details will be added as the course requirements are clarified.
