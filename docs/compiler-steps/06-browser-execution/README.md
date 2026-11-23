# 6. Browser execution

> For common rules see [../README.md](../README.md).

- Status: Draft
- Previous step: Wasm code generation
- Next step: None (final)

## 1. What it does

Run the generated Wasm module and display its drawing in the browser.

### How it works

- Instantiate the generated module with the Canvas drawing imports and call its exported `draw()` function. The drawing wrappers map mathematical coordinates to Canvas pixels.
- Report module loading or execution failures in the Canvas area.

## 2. Input

- Source: Wasm code generation
- Format: The generated Wasm bytes decoded from the code generation response and the Canvas drawing imports.

The JSON below describes the browser inputs and outputs.

```json
{
  "module": {
    "export": "draw"
  },
  "imports": [
    "moveTo",
    "lineTo",
    "stroke",
    "fillCircle"
  ]
}
```

## 3. Output

- Format: The figure drawn on the HTML Canvas.
- How it is shown on screen: HTML Canvas.

### Output keys

The Canvas holds the rendered figure. The keys below describe the illustrative browser result metadata.

| Key | Type | Contents |
|---|---|---|
| `target` | string | The example value `canvas` identifies the HTML Canvas as the render target. |
| `status` | string | The example value `rendered` indicates that `draw()` completed successfully. |

```json
{
  "target": "canvas",
  "status": "rendered"
}
```

## 4. Errors

| Kind | Condition | Example message | Position info |
|---|---|---|---|
| Runtime setup | The code generation response lacks the Wasm payload or its base64 cannot be decoded. | `could not decode the Wasm payload` | Browser response or decoder. |
| Runtime setup | WebAssembly or the Canvas 2D context is unavailable. | `Canvas 2D context is unavailable` | Browser capability or Canvas element. |
| Runtime setup | The decoded bytes fail WebAssembly compilation or validation. | `invalid Wasm module` | WebAssembly compilation error. |
| Runtime setup | An import is missing or incompatible when instantiating the module. | `could not link Canvas imports` | Import name when provided by the browser. |
| Runtime setup | The instance has no callable `draw` export. | `missing Wasm export 'draw'` | The export name. |
| Runtime | A Wasm instruction traps during `draw()`. | `Wasm execution trapped in draw()` | Wasm frame when available. |
| Runtime | A host drawing import throws while Wasm is drawing. | `Canvas drawing operation failed` | Host drawing function when known. |
| Runtime, conditional | An explicit runtime guard detects an invalid value such as a zero denominator or negative `sqrt` argument that depends on a loop variable. | `division by zero during draw()` | Source location if the guard preserves it. |

Runtime guards and source-position mapping are still open. Wasm `f64` division by zero can produce infinity or NaN. A runtime diagnostic for it requires an explicit check.

- Recovery on error: When compilation reports errors, show its diagnostics in the Canvas area. If execution has started and fails, stop drawing and show the runtime diagnostic there.
- Output shape when there are errors: No successful render result. The Canvas area shows the applicable diagnostic.

## 5. API

- Endpoint: The browser runs the stage after receiving the code generation response.
- Request body: The browser uses the decoded Wasm bytes and Canvas drawing functions.
- Response body: Canvas output or a runtime diagnostic.

## 6. Examples and test cases

The files in [cases/](cases/) are empty placeholders. The table describes a candidate case for that folder.

| Case | Kind | Description |
|---|---|---|
| [`cases/_example/`](cases/_example/) | Valid | Run a module that draws a line on the Canvas. |

## 7. Undecided / notes

- Browser-side runtime diagnostics and test assertions remain open.
