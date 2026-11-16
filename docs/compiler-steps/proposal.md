# Compiler Step Proposal (for discussion)

A draft for discussing with the teammate. Not final; once the step layout is decided, we create per-step folders and description docs (see [README.md](README.md)).

- We decided not to do constant folding.
- Steps must be easy to add or change later.

## Proposed steps

| # | Step | Input | Output |
|---|---|---|---|
| 1 | Lexer | raw MiniTikZ text | token list (with positions) |
| 2 | Parser | token list | parse tree |
| 3 | AST conversion | parse tree | AST |
| 4 | Semantic analysis | AST | validated AST + symbol table |
| 5 | Wasm codegen | validated AST | `.wasm` binary (+ text form for display) |
| 6 | Browser execution | `.wasm` | figure drawn on the canvas |

Steps 1–5 are each a separate backend API; step 6 runs in the browser.

## Per-step description

1. **Lexer**
   - Splits input into tokens such as `\draw`, `\i`, numbers, `--` and operators.
   - Error: undefined character. Skip only that character and continue.
2. **Parser**
   - Checks the tokens against the grammar (CFG) and builds the parse tree.
   - Error: syntax error. Skip only the bad statement and keep parsing.
3. **AST conversion**
   - Removes parentheses, semicolons and intermediate rule nodes from the parse tree, leaving Foreach, Draw, Node and expressions.
   - Answers the course requirement (show the AST after the parse tree).
4. **Semantic analysis**
   - Collects the names defined by `\node` into a symbol table. Keep it simple; it can become a BST if it grows.
   - Errors: `\draw` references a missing node, undefined loop variable, division by zero.
   - Division by zero must be caught not only for `1/0` but also for constant expressions that evaluate to zero, like `1/(2-2)`. Do not change the AST; just evaluate constant expressions and check (see [../project-notes.md](../project-notes.md)).
5. **Wasm codegen**
   - Walks the AST and turns it into Wasm instructions.
   - `\foreach` becomes a Wasm loop, expressions become Wasm arithmetic.
   - `moveTo`, `lineTo`, `stroke` are called as imports, and a `draw` function is exported.
6. **Browser execution**
   - Runs the `.wasm` in the browser and draws on the canvas.
   - If there are errors, the error log is shown in the same place.

## To decide together

- Whether to go with these 6 steps. Step 3 (AST conversion) could be merged into step 2 (Parser), but since the parse tree and the AST must be shown separately, we propose keeping them apart.
- Who owns which step.
- When there are errors, whether to draw no graph at all or draw everything except the erroneous part.
