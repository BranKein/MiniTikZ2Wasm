# Wasm ↔ Canvas API (the host contract)

> Status: the four drawing imports and `draw` are **agreed**; the two math imports (`sin`, `cos`) are a proposal added after, to be confirmed with the compiler owner. Open items are at the end. Korean version: [_ko/wasm-canvas-api.md](_ko/wasm-canvas-api.md). The code that implements this contract is [`web-fe/js/canvas.js`](../web-fe/js/canvas.js). This is the document step 5 ([Wasm code generation](compiler-steps/05-codegen/README.md)) must generate against, and step 6 ([Browser execution](compiler-steps/06-browser-execution/README.md)) must provide.

## Overview

The generated Wasm module draws nothing by itself. It **imports** four tiny drawing functions and two math functions that the browser (the host) provides, and **exports** one function, `draw`. The host wraps the Canvas 2D API and converts math coordinates to canvas pixels, so the compiler only ever deals with math coordinates. Everything else MiniTikZ needs is plain Wasm (see "Covering the MiniTikZ language").

```
 codegen output (.wasm)                         browser host (canvas.js)
┌──────────────────────────┐   imports   ┌────────────────────────────────┐
│ draw()  ── calls ────────┼────────────►│ moveTo / lineTo / stroke /     │
│                          │  (module    │ fillCircle  ─► Canvas 2D ctx   │
│                          │   "env")    │ sin / cos   ─► Math (degrees)  │
└──────────────────────────┘             └────────────────────────────────┘
```

## Module contract

### Imports

All six are **function imports** from the import module name **`env`**. Names are case-sensitive. All numbers are `f64`.

| Import (`env.`) | Wasm signature | Meaning |
|---|---|---|
| `moveTo` | `(f64 x, f64 y) -> ()` | Start a new sub-path at math point `(x, y)`. No line is drawn. |
| `lineTo` | `(f64 x, f64 y) -> ()` | Add a straight segment from the current point to math point `(x, y)`. Nothing is visible until `stroke`. |
| `stroke` | `() -> ()` | Draw the current path (everything added by `moveTo`/`lineTo` so far) as an outline. |
| `fillCircle` | `(f64 x, f64 y, f64 r) -> ()` | Draw a filled dot centered at math point `(x, y)`. **`r` is in canvas pixels, not math units.** |
| `sin` | `(f64 degrees) -> f64` | Sine of an angle given in **degrees** (TikZ convention). |
| `cos` | `(f64 degrees) -> f64` | Cosine of an angle given in **degrees**. `cos(60)` is `0.5` (up to floating-point rounding). |

Rules for the generated module:

- Import **only** from `env` and **only** these six names. Importing anything else makes instantiation fail with a link error (the host provides nothing more).
- A module may import a subset (for example no `fillCircle` when it draws no node dots, no `sin`/`cos` when the program uses none).
- The host links imports **by name and signature**, not by index. The order of the imports in the module and their function indices are up to the code generator.
- Declared signatures must match the table exactly (all `f64`; the drawing functions return nothing, `sin`/`cos` return one `f64`). A mismatch also fails instantiation.

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

1. `WebAssembly.instantiate(bytes, { env: { moveTo, lineTo, stroke, fillCircle, sin, cos } })`. It fails here on a missing import, a signature mismatch, or invalid bytes.
2. `ctx.clearRect(...)` over the whole canvas, then `ctx.beginPath()`.
3. `instance.exports.draw()`.

Drawing style is the Canvas default: **black, 1 px lines, black fill**. There is no import to change color or line width.

## Behavior to design around

These follow from how the Canvas 2D path works, and they matter for the code generator.

1. **`stroke` does not clear the path.** The host calls `ctx.stroke()` only. Segments stay in the path, so a later `stroke` draws them again (visually harmless, a little wasteful). Emit `moveTo`, `lineTo`, …, `stroke` once per `\draw` path.
2. **Always start a path with `moveTo`.** After `fillCircle` the current point is on the circle's edge, and `lineTo` with no current point acts like `moveTo`, so a missing `moveTo` draws from the wrong place.
3. **`fillCircle` resets the current path.** The host runs `beginPath()` + `arc` + `fill` for each dot, so any segments added but not yet stroked are **lost**. Call `stroke()` for a pending path **before** calling `fillCircle`.
4. **A path `A -- B -- C`** is `moveTo(A)`, `lineTo(B)`, `lineTo(C)`, `stroke()`. Separate `\draw` commands are separate `moveTo … stroke` groups.
5. **Rounding.** `sin`/`cos` are `Math.sin/cos` on the angle converted to radians, so exact values are not guaranteed: `cos(90)` is about `6e-17`, not `0`. This is invisible when drawing; do not compare results with `==`.
6. **Bad numbers.** The Canvas ignores `moveTo`/`lineTo` with `NaN` or ±∞ (the segment is skipped, no error). `fillCircle` with a **negative** `r` throws in the host (`IndexSizeError`), which surfaces as a drawing/runtime error. Wasm `f64` division by zero gives ±∞ or NaN silently; see "Division by zero" in [compiler-steps/04-semantic](compiler-steps/04-semantic/README.md) and [06-browser-execution](compiler-steps/06-browser-execution/README.md).
7. **Draw order = call order.** Later calls paint over earlier ones.

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
local.get $i
f64.const 1  f64.const 60  call $cos  f64.add   ;; 1 + cos(60)
call $lineTo
call $stroke
```

## Covering the MiniTikZ language

How each part of the source language reaches Wasm. Only the rows marked *host* need an import.

| MiniTikZ | Generated as | Host import |
|---|---|---|
| `\draw (a) -- (b) -- (c);` | `moveTo(a)`, `lineTo(b)`, `lineTo(c)`, `stroke()` | `moveTo`, `lineTo`, `stroke` (*host*) |
| `\node (A) at (x,y) {};` | a dot: `fillCircle(x, y, r)` after pending strokes; the name resolves at compile time or to a local | `fillCircle` (*host*) |
| Node name as a coordinate `(A)` | the node's `x`, `y` (compile-time constants or locals) | none |
| `\foreach \i in {a,...,b}` | Wasm `loop` over an `f64` local | none |
| Loop variable `\i` | `local.get` | none |
| `+ - * /` and parentheses | `f64.add`, `f64.sub`, `f64.mul`, `f64.div` | none |
| unary `-` | `f64.neg` | none |
| `sqrt(e)` | `f64.sqrt` | none (native instruction) |
| `sin(e)`, `cos(e)` | `call $sin` / `call $cos` with the argument in degrees | `sin`, `cos` (*host*) |

Division by zero stays a compile-time diagnostic when the denominator is constant; for a denominator that depends on a loop variable, Wasm `f64.div` gives ±∞/NaN and the Canvas skips the segment (see "Runtime guards" in the open items).

## Changing the contract

Adding or changing an import touches three places; do them together:

1. `makeCanvasImports` in [`web-fe/js/canvas.js`](../web-fe/js/canvas.js) (host side).
2. The import table in this document.
3. The code generator and its tests (`mini-tikz-2-wasm`), plus the Decisions item 3 in [folder-structure.md](folder-structure.md).

## Open items

1. **Confirm `sin`/`cos`.** They are a proposal: degrees (the reference program's `1 + cos(60) = 1.5` needs degrees) and host-provided. The alternative is generating an approximation inside Wasm, which would remove the two imports but adds code-generation work. If the owner wants radians, change `DEG` in `canvas.js` and the table above together.
2. **Auto-fit view.** The view is fixed (scale 80, origin 40/360). A figure outside x, y ∈ [−0.5, 4.5] is cut off. Choosing the view from the figure would need either a host-side bounding-box pass or extra imports.
3. **Style.** No color, line width, or dot-radius imports; MiniTikZ has no style options. The dot radius is chosen by the generator (3 px in the example).
4. **Node text.** Node labels (`{text}`) are not part of the language and no text-drawing import exists. If labels are added, a `fillText`-style import is needed.
5. **Runtime guards.** Whether the generated code checks for division by zero or negative `sqrt` at run time (values that depend on a loop variable) is open; see [06-browser-execution](compiler-steps/06-browser-execution/README.md).
