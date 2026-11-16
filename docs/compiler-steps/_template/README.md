# <number>. <step name>

> Start by copying this whole `_template/` folder to `docs/compiler-steps/<number>-<name>/`. Fill in this README, and delete or rename `cases/_example/` to use it as a real case. Leave unknown parts as "undecided". For common rules see [../README.md](../README.md).

- Status: undecided / draft / final
- Previous step: <step name or "none (raw source)">
- Next step: <step name or "none (final)">

## 1. What it does

Write in one or two paragraphs what this step processes. Also say why it is needed and what it does not do.

### How it works

- Summary of the algorithm / rules (e.g. the RE used, CFG rules, traversal method)
- Kinds of errors found in this step

## 2. Input

- Source: previous step's output / user input
- Format: (JSON schema or field description)

```json
{}
```

## 3. Output

- Format: (JSON schema or field description)
- How it is shown on screen: (table, tree, code, etc.)

```json
{}
```

## 4. Errors

| Kind | Condition | Example message | Position info |
|---|---|---|---|
| syntax / semantic etc. | when it occurs | `undefined node 'b'` | line, column |

- Recovery on error (how far we skip and continue):
- Output shape when there are errors:

## 5. API

- Endpoint: `POST /api/<name>`
- Request body: (same format as the input)
- Response body: (output + error list)

## 6. Examples and test cases

Examples and test cases for this step live in [cases/](cases/). One case is one folder, a pair of input and expected output. Structure and rules follow "Case structure" in [../README.md](../README.md).

| Case | Kind | Description |
|---|---|---|
| `cases/<case name>/` | valid / syntax error / semantic error etc. | one-line description |

## 7. Undecided / notes

- Things not decided yet, things to align with other steps
