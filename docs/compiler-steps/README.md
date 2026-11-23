# Compiler Step Docs (common)

This folder holds one document per compiler step: what the step does, what it takes as input and what it produces. This README contains only what is common to all steps.

The table below lists the current draft pipeline. Steps must be easy to add or change later (see the extensibility requirements in [../demo-web-design.md](../demo-web-design.md)).

## Folder structure

Make one folder per step, as `docs/compiler-steps/<number>-<name>/`. Example: `01-lexer/`. The number is the execution order; renumber when a step is inserted.

```
docs/compiler-steps/
├── README.md                 # this document (common rules, step list)
├── _template/                # source for new step folders. Copy it
│   ├── README.md             # format of a step description doc
│   └── cases/
│       └── _example/         # format of one case
│           ├── input.txt
│           ├── expected.json
│           └── case.md
└── 01-lexer/                 # a step folder (example)
    ├── README.md             # this step: what it does, input, output, errors, API
    └── cases/
        ├── basic/            # one case = one folder
        │   ├── input.txt
        │   ├── expected.json
        │   └── case.md
        └── unknown-char/
            └── ...
```

## Case structure

A case is both an example and a test case for the step. One case is a folder `cases/<case name>/` holding these files.

| File | Required | Content |
|---|---|---|
| `input.txt` or `input.json` | yes | Input of this step. The first step takes MiniTikZ source, so `input.txt`; later steps take the previous step's output, so `input.json` |
| `expected.json` | yes | Expected output of this step. Shaped as `{ "output": ..., "errors": [...] }`; `errors` is an empty array when there are none |
| `case.md` | no | Kind of case (valid, syntax error, semantic error, ...), what it checks, whether to use it as a demo example button |

Rules:

- Case names are lowercase with `-`. E.g. `basic`, `missing-brace`, `divide-by-zero`.
- Write the expected output in the same format as the step's API response, so it can be used directly in automated tests.
- A case's `expected.json` can be reused as the next step's case `input.json`.
- Keep cases readable as data, so the demo's example input buttons can be built from them.

## Doc rules

- Start a new step by copying the whole [_template/](_template/) folder.
- When a step folder is added, removed or renamed, also update the "Step list" table below.

## Common principles

- The five compiler stages each have a separate backend API in the draft design and exchange data as JSON. Browser execution runs the generated Wasm locally.
- Each step's output must be showable as is in the per-step result box on the page.
- Even with syntax errors, skip only the offending part (record the error) and keep processing. Each step collects errors with line/column and returns them.
- If there are errors, show the error log; otherwise draw the graph.
- We must show at least 2 kinds of errors (syntax, semantic). For the course requirements, see [../project-notes.md](../project-notes.md).

## Step list

| No. | Step | Folder | Status |
|---|---|---|---|
| 1 | Lexer | [`01-lexer/`](01-lexer/README.md) | Draft |
| 2 | Parser | [`02-parser/`](02-parser/README.md) | Draft |
| 3 | AST conversion | [`03-ast/`](03-ast/README.md) | Draft |
| 4 | Semantic analysis | [`04-semantic/`](04-semantic/README.md) | Draft |
| 5 | Wasm code generation | [`05-codegen/`](05-codegen/README.md) | Draft |
| 6 | Browser execution | [`06-browser-execution/`](06-browser-execution/README.md) | Draft |
