# 2. Parser

> For common rules see [../README.md](../README.md).

- Status: Draft
- Previous step: Lexer
- Next step: AST conversion

## 1. What it does

Build a parse tree that shows how the token stream matches the CFG.

### How it works

- Apply the CFG to the token stream. Keep grammar-rule nodes and punctuation in the parse tree so the demo can show how the source matched the grammar.
- Report unexpected tokens and premature end of input.

## 2. Input

- Source: Lexer
- Format: The ordered token list and token locations produced by the lexer.

The JSON below illustrates the data shape. Token lists and trees may be excerpts, and field names are provisional.

```json
[
  {
    "kind": "DRAW",
    "lexeme": "\\draw",
    "line": 1,
    "column": 1
  }
]
```

## 3. Output

- Format: A parse tree with grammar-rule nodes, token leaves, and source positions.
- How it is shown on screen: Parse tree.

### Output keys

The stage output is the root of the parse tree. The example shows one rule node from the tree.

| Key | Type | Contents |
|---|---|---|
| `rule` | string | Name of the CFG rule represented by this node, such as `draw`. |
| `children` | array of rule nodes or token objects | Children in source order. A grammar child uses the same rule-node fields recursively. A terminal uses the [lexer token fields](../01-lexer/README.md#3-output). |
| `line` | integer | 1-based source line where the rule begins. |
| `column` | integer | 1-based source column where the rule begins. |

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
  "rule": "draw",
  "children": [
    {
      "kind": "DRAW",
      "lexeme": "\\draw",
      "line": 1,
      "column": 1
    }
  ],
  "line": 1,
  "column": 1
}
```

## 4. Errors

| Kind | Condition | Example message | Position info |
|---|---|---|---|
| Syntax | An unknown command or a token where a statement should begin. | `expected a MiniTikZ statement` | The unexpected token. |
| Syntax | A statement is missing its terminating semicolon. | `expected ';' after draw statement` | The next token or end of input. |
| Syntax | An opening or closing parenthesis or brace is missing, unmatched, or in the wrong order. | `expected '}' to close foreach body` | The unexpected token or end of input. |
| Syntax | A coordinate is missing a component, a separating comma, or has an extra component. | `expected ',' between coordinate components` | The first unexpected token or end of input. |
| Syntax | A draw path is missing its `--` separator or a point after it. | `expected a path point after '--'` | The next token or end of input. |
| Syntax | A node declaration is missing a name, `at`, or its position. | `expected 'at' after node name` | The next token or end of input. |
| Syntax | A foreach header is missing its variable, `in`, range punctuation, or a range endpoint. | `expected a range endpoint after '...'` | The next token or end of input. |
| Syntax | A foreach header is missing its opening body brace. | `expected '{' to start foreach body` | The next token or end of input. |
| Syntax | An arithmetic operator is missing an operand, or adjacent operands are missing an operator. | `expected an expression after '+'` | The next token or end of input. |
| Syntax | A function call has misplaced punctuation or a missing argument required by the grammar. | `expected a function argument` | The unexpected token or end of input. |
| Syntax | The picture wrapper is missing, mismatched, or followed by extra input, where the grammar requires the wrapper. | `expected end of tikzpicture` | The unexpected token or end of input. |

The final CFG determines which constructs are accepted and which tokens terminate recovery.

- Recovery on error: Resume at a statement or block boundary where possible. Respect nesting when looking for a closing delimiter. Stop at end of input.
- Output shape when there are errors: Return a partial parse tree with the valid statements and the syntax diagnostics.

## 5. API

- Endpoint: `POST /api/parse` (proposed)
- Request body: Takes the data described in the Input section. JSON field names remain open.
- Response body: Returns the stage output and diagnostics. The common README describes `output` and `errors` as the draft response shape.

## 6. Examples and test cases

The files in [cases/](cases/) are empty placeholders. The table describes a candidate case for that folder.

| Case | Kind | Description |
|---|---|---|
| [`cases/_example/`](cases/_example/) | Valid | Parse a draw command with two coordinates. |

## 7. Undecided / notes

- The CFG, synchronization tokens, and parse-tree schema remain open.
