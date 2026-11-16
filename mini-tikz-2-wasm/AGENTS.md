# AGENTS.md (mini-tikz-2-wasm)

Instructions for the compiler package. The repository-wide rules are in [../AGENTS.md](../AGENTS.md); this file adds what is specific to this package.

## Scaffolding only: discuss the structure first

- The current layout (`lexer.py`, `parser.py`, `ast_nodes.py`, `symbol_table.py`, `semantic.py`, `codegen.py`, `errors.py`, and the `STEPS` list in `__init__.py`) is a **scaffold proposal**, not a decision. See [../docs/folder-structure.md](../docs/folder-structure.md).
- You do **not** have to implement the compiler to fit this skeleton. Before building real logic, discuss the structure with the user: module split, step list and names, AST node design, symbol table, error and `Diagnostic` format, and what each step takes and returns.
- Do not rename or reshape existing public names (`STEPS`, `lex`, `parse`, `analyze`, `codegen`, `Diagnostic`, `CompileError`) silently. `web-be` imports them, so tell the user what else must change.
- The compiler step list is still open (see "Open questions" in the folder-structure doc). Do not treat the 4 current steps as final.
- Constant folding is not part of this compiler. Division by zero must still be detected, including constant expressions like `1/(2-2)`, by evaluating them in semantic analysis without changing the AST.

## Who owns what

| Area | Owner |
|---|---|
| Compiler logic (`mini-tikz-2-wasm/src/`) | [@6QB6](https://github.com/6QB6) |
| Web front end (`web-fe/`), backend (`web-be/`), and test code | [@BranKein](https://github.com/BranKein) |

- Keep changes inside the owner's area unless the user asks otherwise. If a change needs the other area (for example a new field in a compiler result that `web-be` or the tests depend on), say so and leave that part to its owner.
- Tests are written by the test owner. Do not rewrite or delete existing tests to make them pass. If a test fails because of your change, or a test looks wrong, report it to the user.

## Tests: run before every push

- From the repository root, run the package tests, then the backend tests, and push only when both pass:

  ```sh
  uv run --package mini-tikz-2-wasm pytest
  uv run --package web-be pytest
  ```

- If a test fails, do not push. Fix the cause, or tell the user what failed and why.
- Pushing without running the tests, or while they fail, needs the user's explicit OK.
- The scaffold's smoke tests expect the stub steps to raise `NotImplementedError`. When a step is really implemented, the matching smoke test (owned by the test owner) must be updated; tell the user instead of editing it yourself.
