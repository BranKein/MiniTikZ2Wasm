# 3. AST conversion

> For common rules see [../README.md](../README.md).

- Status: Draft
- Previous step: Parser
- Next step: Semantic analysis

## 1. What it does

Convert the parse tree to the AST used by semantic analysis.

### How it works

- Convert grammar rules into AST nodes for `Node`, `Draw`, `Foreach`, coordinates, and expressions. Remove punctuation and intermediate grammar nodes while preserving expression grouping and source positions.
- Use the parser diagnostics for statements it skipped.

## 2. Input

- Source: Parser
- Format: The full or partial parse tree produced by the parser.

The JSON below illustrates the data shape. Token lists and trees may be excerpts, and field names are provisional.

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

## 3. Output

- Format: An AST with command and expression nodes and source positions.
- How it is shown on screen: AST tree, shown after the parse tree.

### Output keys

The stage output is a `Program` node whose `body` holds the statements. The example excerpts one `Draw` node. The `kind`, `line`, and `column` keys are common to AST nodes. Coordinate objects use `x` and `y`. The remaining keys depend on `kind`.

| Key | Type | Contents |
|---|---|---|
| `kind` | string | Identifies the node variant, such as `Program`, `Draw`, `Node`, or `Foreach`. |
| `line` | integer | 1-based source line where the AST node begins. |
| `column` | integer | 1-based source column where the AST node begins. |
| `body` | array of statement nodes | Statements in source order for `Program` and `Foreach`. |
| `points` | array of coordinates or node references | Ordered path points for `Draw`. |
| `name` | string | Name in a `Node` declaration, a `NodeRef`, or a `Variable` expression. |
| `position` | coordinate object | Declared position of a `Node`. |
| `x`, `y` | number or expression object | The horizontal and vertical components of a coordinate, respectively. |
| `variable` | string | Name introduced by `Foreach`. |
| `start`, `end` | number or expression object | First and last values of the `Foreach` range. |
| `operator` | string | Arithmetic operator on a `Unary` or `Binary` expression. |
| `operand` | number or expression object | Operand of a `Unary` expression. |
| `left`, `right` | number or expression object | Left and right operands of a `Binary` expression. |
| `function` | string | Function name on a `Call` expression, such as `sin`, `cos`, or `sqrt`. |
| `argument` | number or expression object | Argument of a `Call` expression. |

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

## 4. Errors

| Kind | Condition | Example message | Position info |
|---|---|---|---|
| Upstream syntax | Parser recovery skipped a statement. | `expected ';'` | Source position reported by the parser. |
| Internal AST conversion | The parse tree contains a grammar rule with no AST mapping. | `no AST mapping for parse rule` | Start of the rule, if available. |
| Internal AST conversion | A supposedly valid parse-tree node lacks a required child or has a child of an unexpected kind. | `malformed draw parse-tree node` | Start of the affected rule, if available. |
| Internal AST conversion | A token value cannot be converted to its expected AST representation despite having passed lexing and parsing. | `cannot convert numeric token to AST value` | The token, if available. |

The syntax row refers to an existing parser diagnostic. Internal conversion errors indicate a parse-tree contract or compiler implementation problem.

- Recovery on error: Convert statements the parser recovered. If a conversion error is isolated to one subtree, skip that subtree and continue with independent statements.
- Output shape when there are errors: Return a partial AST and any new conversion diagnostics when recovery is possible. Return a null output if there is no usable AST. Display earlier parser diagnostics once.

## 5. API

- Endpoint: `POST /api/ast` (proposed)
- Request body: Takes the data described in the Input section. JSON field names remain open.
- Response body: Returns the stage output and diagnostics. The common README describes `output` and `errors` as the draft response shape.

## 6. Examples and test cases

The files in [cases/](cases/) are empty placeholders. The table describes a candidate case for that folder.

| Case | Kind | Description |
|---|---|---|
| [`cases/_example/`](cases/_example/) | Valid | Convert a draw command into an AST while preserving its coordinates. |

## 7. Undecided / notes

- The AST fields above are provisional. The complete node schema and representation of recovered regions remain open.
