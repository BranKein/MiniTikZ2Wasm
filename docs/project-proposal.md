# Project Proposal

## Project Name

MiniTikZ2Wasm

## Project Details

### What will your compiler/language do? What is the source language and the target?

MiniTikZ2Wasm compiles graph drawings written in MiniTikZ, a small subset and modified version of TikZ, into a WebAssembly binary that renders the drawing on a web page.

- **Source language: MiniTikZ.** It has three commands (`\node`, `\draw`, `\foreach`), straight-line paths (`--`), and coordinates given as arithmetic expressions or node names. Expressions support `+ - * /`, parentheses, `sin`, `cos`, `sqrt`, and the `\foreach` loop variable.
- **Target: a WebAssembly binary module (`.wasm`).** The module exports a `draw` function and imports a few drawing functions (`moveTo`, `lineTo`, `stroke`, …) that wrap the browser's Canvas 2D API.
- **What the user sees:** the user types MiniTikZ code into a text box on a web page. Each compiler step is run outside the browser (backend server) and visualized below the text box. The generated module draws the figure on a canvas beside the text box, similar to what LaTeX TikZ would produce. Errors are shown with line and column positions.

### Input test for each layer and expected output

For each layer of the compiler, an example input and the expected output.

Example MiniTikZ program:

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

1. **Lexer**
   - Input: MiniTikZ source code.
   - Output: Tokens such as `FOREACH`, `DRAW`, `VAR`, `NUMBER`, and arithmetic operators, with source positions.
2. **Parser**
   - Input: Token stream.
   - Output: An AST representing a `Foreach` loop containing a `Draw` command and two coordinates.
3. **Semantic Analysis**
   - Input: AST.
   - Output: A type-annotated AST with validated variables, nodes, and drawing options. Undefined node references produce errors (e.g., `undefined node 'b'`).
4. **Wasm Code Generation**
   - Input: Optimized AST.
   - Output: A valid WebAssembly binary module exporting a `draw` function, with a loop compiled into Wasm instructions.
5. **Browser Execution**
   - Input: Generated Wasm module.
   - Output: Four vertical lines at x = 0, 1, 2, and 3, with black dots at both endpoints of the line at x = 0, rendered on an HTML Canvas.
