# 1. Lexer

> For common rules see [../README.md](../README.md).

- Status: Draft
- Previous step: Raw MiniTikZ source
- Next step: Parser

## 1. What it does

Turn MiniTikZ source into the token stream used by the parser.

### How it works

- Recognize commands, identifiers, loop variables, numbers, and punctuation using token rules. Match multi-character tokens such as `--` before their single-character prefixes.
- Report characters that cannot be tokenized.

## 2. Input

- Source: User input
- Format: MiniTikZ source as a text string.

The JSON below illustrates the data shape. Token lists and trees may be excerpts, and field names are provisional.

```json
{
  "source": "\\draw (0,0) -- (1,0);"
}
```

## 3. Output

- Format: An ordered token list with token kinds, lexemes, and source positions.
- How it is shown on screen: Token table.

### Output keys

The stage output is a token array in source order. The following keys appear on each token.

| Key | Type | Contents |
|---|---|---|
| `kind` | string | Token kind selected by the lexer, such as `DRAW`, `NUMBER`, or the end-of-input marker. |
| `lexeme` | string | Exact text matched in the source, such as `\draw`. The end-of-input marker has an empty lexeme. |
| `line` | integer | 1-based source line of the token’s first character. |
| `column` | integer | 1-based source column of the token’s first character. |

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
[
  {
    "kind": "DRAW",
    "lexeme": "\\draw",
    "line": 1,
    "column": 1
  }
]
```

## 4. Errors

| Kind | Condition | Example message | Position info |
|---|---|---|---|
| Lexical | Unrecognized character, such as `@`. | `unexpected character '@'` | The character. |
| Lexical | A backslash without a valid command or variable name after it. | `expected a name after the backslash` | The backslash. |
| Lexical | A malformed numeric candidate, such as `12.3.4`, if the token rules recognize it as one candidate. | `invalid number literal '12.3.4'` | Start of the numeric candidate. |
| Lexical | An unsupported control character in the source, such as NUL. | `invalid control character U+0000` | The control character. |

Exact token rules remain open. A well-formed backslash name can be tokenized even if the parser later rejects it in command position.

- Recovery on error: Skip one invalid character or the malformed token candidate. Resume at the next token boundary.
- Output shape when there are errors: Return the tokens recognized through the end of the source and all lexical diagnostics.

## 5. API

- Endpoint: `POST /api/lex` (proposed)
- Request body: Takes the source described in the Input section. JSON field names remain open.
- Response body: Returns the stage output and diagnostics. The common README describes `output` and `errors` as the draft response shape.

## 6. Examples and test cases

The files in [cases/](cases/) are empty placeholders. The table describes a candidate case for that folder.

| Case | Kind | Description |
|---|---|---|
| [`cases/_example/`](cases/_example/) | Valid | Tokenize coordinates and recognize `--` as one token. |

## 7. Undecided / notes

- Token rules and the final token schema remain open.
