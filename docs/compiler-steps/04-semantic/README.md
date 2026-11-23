# 4. Semantic analysis

> For common rules see [../README.md](../README.md).

- Status: Draft
- Previous step: AST conversion
- Next step: Wasm code generation

## 1. What it does

Validate the AST and resolve the symbols needed by code generation.

### How it works

- Resolve node names and loop variables using symbol information. Evaluate constant denominator expressions for the division-by-zero check while preserving the AST, including in cases such as `1/(2-2)`.
- Check unresolved references and constant division by zero.

## 2. Input

- Source: AST conversion
- Format: The full or partial AST produced by AST conversion.

The JSON below illustrates the data shape. Token lists and trees may be excerpts, and field names are provisional.

```json
{
  "kind": "Draw",
  "points": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
      "y": 0
    }
  ],
  "line": 1,
  "column": 1
}
```

## 3. Output

- Format: The analyzed AST and symbol information.
- How it is shown on screen: AST tree and symbol information alongside diagnostics.

### Output keys

The stage output has two top-level keys. Fields of each symbol entry are listed as `symbols[]` paths. The example excerpts a single `Draw` node in `ast`.

| Key | Type | Contents |
|---|---|---|
| `ast` | object | Analyzed AST, using the [AST output fields](../03-ast/README.md#3-output). It may be partial after recovery. |
| `symbols` | array of objects | Node and loop-variable declarations collected during analysis. An empty array means no declarations were collected. |
| `symbols[].kind` | string | Declaration kind, `node` or `loopVariable`. |
| `symbols[].name` | string | Declared identifier without the leading backslash for a loop variable. |
| `symbols[].line` | integer | 1-based line of the declaration. |
| `symbols[].column` | integer | 1-based column of the declaration. |

#### API response keys

The common README proposes `output` and `errors` as the response fields. The JSON example shows only the value inside `output`.

| Key | Type | Contents |
|---|---|---|
| `output` | stage output or `null` | Stage data with the shape shown in the example. It can contain a recovered result. Use `null` when the stage has no result to return. |
| `errors` | array of diagnostic objects | Diagnostics produced by this stage. An empty array means the stage produced none. |
| `errors[].kind` | string | Diagnostic category. |
| `errors[].message` | string | Diagnostic message shown to the user. |
| `errors[].line`, `errors[].column` | integers or `null` | 1-based source line and column. Both are `null` when the diagnostic has no source location. |

```json
{
  "ast": {
    "kind": "Draw",
    "points": [
      {
        "x": 0,
        "y": 0
      },
      {
        "x": 1,
        "y": 0
      }
    ],
    "line": 1,
    "column": 1
  },
  "symbols": []
}
```

## 4. Errors

| Kind | Condition | Example message | Position info |
|---|---|---|---|
| Semantic | A node reference has no visible declaration. | `undefined node 'B'` | The node reference. |
| Semantic | A loop variable is referenced outside its scope or was never declared. | `undefined loop variable 'i'` | The variable reference. |
| Semantic | A constant denominator evaluates to zero, including `1/0` and `1/(2-2)`. | `division by zero` | The denominator expression. |
| Semantic | The constant argument of `sqrt` is negative for real-valued coordinates. | `sqrt requires a nonnegative argument` | The argument expression. |
| Semantic, conditional | A node name is declared twice in the same scope if duplicate declarations are disallowed. | `duplicate node 'A'` | The later declaration. |
| Semantic, conditional | A function name is unsupported if the grammar accepts generic calls. | `unknown function 'tan'` | The function name. |
| Semantic, conditional | A function receives the wrong number of arguments if the grammar accepts a variable-length argument list. | `sqrt expects one argument` | The argument list. |
| Semantic, conditional | A foreach bound violates the chosen range rules, such as an integral-bound requirement. | `foreach bound must be an integer` | The invalid bound expression. |
| Semantic, conditional | A descending foreach range is used if the chosen range rules allow only ascending bounds. | `foreach range must be ascending` | The range expression. |
| Semantic, conditional | A numeric literal or a constant coordinate evaluates to a non-finite value if finite values are required. | `coordinate must be finite` | The literal or coordinate expression. |

Conditional rows depend on the grammar and semantic rules still to be agreed. Checks of constant expressions leave the AST intact. Values depending on loop variables may require a runtime check.

- Recovery on error: Continue checking independent statements and expressions. Suppress follow-on diagnostics caused only by a reference that already failed to resolve.
- Output shape when there are errors: Return the analyzed result and semantic diagnostics. Any compiler error blocks code generation.

## 5. API

- Endpoint: `POST /api/analyze` (proposed)
- Request body: Takes the data described in the Input section. JSON field names remain open.
- Response body: Returns the stage output and diagnostics. The common README describes `output` and `errors` as the draft response shape.

## 6. Examples and test cases

The files in [cases/](cases/) are empty placeholders. The table describes a candidate case for that folder.

| Case | Kind | Description |
|---|---|---|
| [`cases/_example/`](cases/_example/) | Semantic error | Check division by the constant expression `(2-2)`. |

## 7. Undecided / notes

- The symbol fields above are provisional. Name visibility and the handling of division by a runtime value remain open.
