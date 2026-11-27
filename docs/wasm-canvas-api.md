# Wasm ↔ Canvas API (the host contract)

> Status: **agreed** for the four drawing imports and the `draw` export; open items are at the end. Korean version: [_ko/wasm-canvas-api.md](_ko/wasm-canvas-api.md). The code that implements this contract is [`web-fe/js/canvas.js`](../web-fe/js/canvas.js). This is the document step 5 ([Wasm code generation](compiler-steps/05-codegen/README.md)) must generate against, and step 6 ([Browser execution](compiler-steps/06-browser-execution/README.md)) must provide.

## Overview

The generated Wasm module draws nothing by itself. It **imports** four tiny drawing functions that the browser (the host) provides, and **exports** one function, `draw`. The host wraps the Canvas 2D API and converts math coordinates to canvas pixels, so the compiler only ever deals with math coordinates.

```
 codegen output (.wasm)                         browser host (canvas.js)
┌──────────────────────────┐   imports   ┌────────────────────────────────┐
│ draw()  ── calls ────────┼────────────►│ moveTo / lineTo / stroke /     │
│                          │  (module    │ fillCircle  ─► Canvas 2D ctx   │
└──────────────────────────┘   "env")    └────────────────────────────────┘
```

## Module contract

### Imports

All four are **function imports** from the import module name **`env`**. Names are case-sensitive. All numbers are `f64`; none returns a value.

| Import (`env.`) | Wasm signature | Meaning |
|---|---|---|
| `moveTo` | `(f64 x, f64 y) -> ()` | Start a new sub-path at math point `(x, y)`. No line is drawn. |
| `lineTo` | `(f64 x, f64 y) -> ()` | Add a straight segment from the current point to math point `(x, y)`. Nothing is visible until `stroke`. |
| `stroke` | `() -> ()` | Draw the current path (everything added by `moveTo`/`lineTo` so far) as an outline. |
| `fillCircle` | `(f64 x, f64 y, f64 r) -> ()` | Draw a filled dot centered at math point `(x, y)`. **`r` is in canvas pixels, not math units.** |

Rules for the generated module:

- Import **only** from `env` and **only** these four names. Importing anything else makes instantiation fail with a link error (the host provides nothing more).
- A module may import a subset (for example no `fillCircle` when it draws no node dots).
- The host links imports **by name and signature**, not by index. The order of the imports in the module and their function indices are up to the code generator.
- Declared signatures must match the table exactly (`f64` parameters, no results). A mismatch also fails instantiation.

### Exports

| Export | Wasm signature | Meaning |
|---|---|---|
| `draw` | `() -> ()` | Draws the whole figure by calling the imports. The host calls it exactly once. |

- No memory, table, or global needs to be imported or exported. Other exports are ignored by the host.
- Do **not** use a Wasm `start` function to draw. It would run during instantiation, before the host clears the canvas. Put all drawing in `draw`.

## Coordinates

The module only uses **math coordinates** (`f64`): x grows to the right, y grows **up**, like a plot. The host converts each point with:

```
pixel_x = originX + x * scale
pixel_y = originY - y * scale        (the minus flips the y axis; canvas y grows downward)
```

Current view (`makeCanvasImports` in `canvas.js`), for the 400×400 canvas in `index.html`:

| Setting | Value |
|---|---|
| `scale` | 80 px per math unit |
| `originX` | 40 px |
| `originY` | `canvas.height - 40` = 360 px |
| Visible math range | x ∈ [−0.5, 4.5], y ∈ [−0.5, 4.5] |

So the reference program (x = 0…3, y = 0…2.5) fits. Points outside the range are simply clipped by the canvas. Auto-fitting the view to the figure is not done (see open items).

Only the point coordinates are scaled. The `fillCircle` radius `r` is **pixels** and is not scaled.

## How the host runs the module

`runWasm(bytes, ctx)` in `canvas.js`, in order:

1. `WebAssembly.instantiate(bytes, { env: { moveTo, lineTo, stroke, fillCircle } })`. It fails here on a missing import, a signature mismatch, or invalid bytes.
2. `ctx.clearRect(...)` over the whole canvas, then `ctx.beginPath()`.
3. `instance.exports.draw()`.

Drawing style is the Canvas default: **black, 1 px lines, black fill**. There is no import to change color or line width.

## Behavior to design around

These follow from how the Canvas 2D path works, and they matter for the code generator.

1. **`stroke` does not clear the path.** The host calls `ctx.stroke()` only. Segments stay in the path, so a later `stroke` draws them again (visually harmless, a little wasteful). Emit `moveTo`, `lineTo`, …, `stroke` once per `\draw` path.
2. **Always start a path with `moveTo`.** After `fillCircle` the current point is on the circle's edge, and `lineTo` with no current point acts like `moveTo`, so a missing `moveTo` draws from the wrong place.
3. **`fillCircle` resets the current path.** The host runs `beginPath()` + `arc` + `fill` for each dot, so any segments added but not yet stroked are **lost**. Call `stroke()` for a pending path **before** calling `fillCircle`.
4. **A path `A -- B -- C`** is `moveTo(A)`, `lineTo(B)`, `lineTo(C)`, `stroke()`. Separate `\draw` commands are separate `moveTo … stroke` groups.
5. **Bad numbers.** The Canvas ignores `moveTo`/`lineTo` with `NaN` or ±∞ (the segment is skipped, no error). `fillCircle` with a **negative** `r` throws in the host (`IndexSizeError`), which surfaces as a drawing/runtime error. Wasm `f64` division by zero gives ±∞ or NaN silently; see "Division by zero" in [compiler-steps/04-semantic](compiler-steps/04-semantic/README.md) and [06-browser-execution](compiler-steps/06-browser-execution/README.md).
6. **Draw order = call order.** Later calls paint over earlier ones.

## Example

The reference program has a node dot at both ends of one line. For one line from (0,0) to (0,2) with dots, the text form of a module that honors the contract is:

```wat
(module
  (import "env" "moveTo"     (func $moveTo     (param f64 f64)))
  (import "env" "lineTo"     (func $lineTo     (param f64 f64)))
  (import "env" "stroke"     (func $stroke))
  (import "env" "fillCircle" (func $fillCircle (param f64 f64 f64)))

  (func (export "draw")
    ;; \draw (A) -- (B);   A=(0,0), B=(0,2)
    f64.const 0  f64.const 0  call $moveTo
    f64.const 0  f64.const 2  call $lineTo
    call $stroke                                  ;; stroke BEFORE the dots

    ;; node dots, radius 3 px
    f64.const 0  f64.const 0  f64.const 3  call $fillCircle
    f64.const 0  f64.const 2  f64.const 3  call $fillCircle))
```

A `\foreach \i in {1,...,3}` loop becomes a Wasm loop over an `f64` local; each iteration emits its own `moveTo`, `lineTo`, `stroke`:

```wat
;; for i = 1..3 : \draw (i,0) -- (i, 1 + cos(60));   (pseudo-code for the loop body)
local.get $i  f64.const 0                call $moveTo
local.get $i  <1 + cos(60) as f64 code>  call $lineTo
call $stroke
```

## Changing the contract

Adding or changing an import touches three places; do them together:

1. `makeCanvasImports` in [`web-fe/js/canvas.js`](../web-fe/js/canvas.js) (host side).
2. The import table in this document.
3. The code generator and its tests (`mini-tikz-2-wasm`), plus the Decisions item 3 in [folder-structure.md](folder-structure.md).

## Open items

1. **`sin` / `cos` are not available to the module.** Wasm has `f64.sqrt` but no sine or cosine instruction, and the contract has no math imports. The language needs `sin` and `cos`. Options: (a) add host imports `env.sin(f64) -> f64` and `env.cos(f64) -> f64` backed by `Math.sin/cos` (simplest; this document and `canvas.js` would grow two entries), or (b) generate a polynomial approximation in Wasm. Needs a decision.
2. **Degrees or radians.** The reference program `cos(60)` implies **degrees** (TikZ style, `1 + cos(60) = 1.5`). Whoever owns the language semantics must fix this, since the host `Math.cos` takes radians.
3. **Auto-fit view.** The view is fixed (scale 80, origin 40/360). A figure outside x, y ∈ [−0.5, 4.5] is cut off. Choosing the view from the figure would need either a host-side bounding-box pass or extra imports.
4. **Style.** No color, line width, or dot-radius imports. The dot radius is chosen by the generator (3 px in the example).
5. **Runtime guards.** Whether the generated code checks for division by zero or negative `sqrt` at run time (values that depend on a loop variable) is open; see [06-browser-execution](compiler-steps/06-browser-execution/README.md).
