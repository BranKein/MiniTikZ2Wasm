# Things to Watch During the Project

## Implementation order

- We must draw the CFG (grammar). Before that, write the RE (regular expressions, i.e. token definitions).

## Error handling

- If part of the input has a syntax error, skip only that part (report the error) and keep compiling the rest (error recovery).
- **We must show at least 2 kinds of errors.**
  - Syntax error: the grammar is violated.
  - Semantic error: `\draw` references a node that does not exist.
  - Semantic error: division by zero in an arithmetic expression (must be prevented).
    - **Catch not only `1/0` but also constant expressions that evaluate to zero, such as `1/(2-2)`.** We decided not to do constant folding, so the semantic step does not change the AST; it only evaluates constant expressions and checks whether the divisor is zero. (Do not forget this.)

## Visualization

- After the parse tree, also show the AST on screen.

## Symbol table

- Optional, not required.
- This project must keep node information (name, coordinates), so building one is recommended. Some designs store that information in the AST instead.
- Keep it simple. If it may grow, a BST implementation is fine.
