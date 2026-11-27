// Run: node --test web-fe/tests/
import test from "node:test";
import assert from "node:assert/strict";
import { makeCanvasImports, makeRecordingImports, fitView, runWasm } from "../js/canvas.js";

// --- Hand-assembled Wasm module that follows docs/wasm-canvas-api.md -------------------------------
// draw(): moveTo(0,0); lineTo(1, 1 + cos(60)); stroke(); fillCircle(0, 0, 3)
const uleb = (n) => { const o = []; do { let b = n & 0x7f; n >>>= 7; if (n) b |= 0x80; o.push(b); } while (n); return o; };
const str = (s) => [...Buffer.from(s)];
const vec = (items) => [...uleb(items.length), ...items.flat()];
const section = (id, body) => [id, ...uleb(body.length), ...body];
const f64c = (v) => [0x44, ...new Uint8Array(new Float64Array([v]).buffer)];
const F = 0x7c;

function buildDrawModule() {
  const types = vec([
    [0x60, ...vec([[F], [F]]), 0x00],         // 0: (f64 f64) -> ()
    [0x60, 0x00, 0x00],                       // 1: () -> ()
    [0x60, ...vec([[F], [F], [F]]), 0x00],    // 2: (f64 f64 f64) -> ()
    [0x60, ...vec([[F]]), ...vec([[F]])],     // 3: (f64) -> (f64)
  ]);
  const imp = (name, type) => [...uleb(3), ...str("env"), ...uleb(name.length), ...str(name), 0x00, type];
  const imports = vec([imp("moveTo", 0), imp("lineTo", 0), imp("stroke", 1), imp("fillCircle", 2), imp("cos", 3)]);
  const MOVE = 0, LINE = 1, STROKE = 2, CIRCLE = 3, COS = 4, DRAW = 5;
  const body = [
    0x00, // no locals
    ...f64c(0), ...f64c(0), 0x10, MOVE,
    ...f64c(1), ...f64c(1), ...f64c(60), 0x10, COS, 0xa0, 0x10, LINE, // 1 + cos(60); f64.add = 0xa0
    0x10, STROKE,
    ...f64c(0), ...f64c(0), ...f64c(3), 0x10, CIRCLE,
    0x0b,
  ];
  return Uint8Array.from([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    ...section(1, types),
    ...section(2, imports),
    ...section(3, vec([[1]])),
    ...section(7, vec([[...uleb(4), ...str("draw"), 0x00, DRAW]])),
    ...section(10, vec([[...uleb(body.length), ...body]])),
  ]);
}

// Fake 2D context that records calls.
function fakeCtx(width = 400, height = 400) {
  const calls = [];
  const rec = (name) => (...args) => calls.push([name, ...args]);
  return {
    canvas: { width, height }, calls,
    clearRect: rec("clearRect"), beginPath: rec("beginPath"), moveTo: rec("moveTo"),
    lineTo: rec("lineTo"), stroke: rec("stroke"), arc: rec("arc"), fill: rec("fill"),
  };
}

test("sin and cos take degrees", () => {
  const env = makeCanvasImports(fakeCtx());
  assert.ok(Math.abs(env.cos(60) - 0.5) < 1e-12);
  assert.ok(Math.abs(env.sin(90) - 1) < 1e-12);
  assert.ok(Math.abs(env.cos(90)) < 1e-12);
  assert.ok(Math.abs(env.sin(30) - 0.5) < 1e-12);
});

test("makeCanvasImports converts math coordinates to pixels with y flipped", () => {
  const ctx = fakeCtx();
  const env = makeCanvasImports(ctx, { scale: 10, originX: 5, originY: 100 });
  env.moveTo(1, 2);
  env.lineTo(3, 4);
  assert.deepEqual(ctx.calls, [["moveTo", 15, 80], ["lineTo", 35, 60]]);
});

test("recording imports collect finite points only", () => {
  const points = [];
  const env = makeRecordingImports(points);
  env.moveTo(0, 0);
  env.lineTo(NaN, 1);
  env.lineTo(1, Infinity);
  env.fillCircle(2, 3, 3);
  assert.deepEqual(points, [[0, 0], [2, 3]]);
});

test("fitView keeps all points inside the canvas margin and centers them", () => {
  const points = [[0, 0], [30, 0], [30, 5]];
  const v = fitView(points, 400, 400);
  for (const [x, y] of points) {
    const px = v.originX + x * v.scale, py = v.originY - y * v.scale;
    assert.ok(px >= 40 - 1e-9 && px <= 360 + 1e-9, `px ${px}`);
    assert.ok(py >= 40 - 1e-9 && py <= 360 + 1e-9, `py ${py}`);
  }
  // Horizontal extent fills the width; the figure is centered vertically.
  assert.ok(Math.abs(v.originX - 40) < 1e-9);
  assert.ok(Math.abs(v.originY - v.scale * 5 - (400 - 5 * v.scale) / 2) < 1e-9);
});

test("fitView handles empty, single-point and line-only figures", () => {
  assert.equal(fitView([], 400, 400).scale, 80);
  assert.equal(fitView([[2, 2]], 400, 400).scale, 100);
  assert.equal(fitView([[0, 0], [0, 2]], 400, 400).scale, 100);
});

test("runWasm draws the module on the canvas, using the cos import", async () => {
  const ctx = fakeCtx();
  await runWasm(buildDrawModule(), ctx);
  const names = ctx.calls.map((c) => c[0]);
  assert.deepEqual(names, ["clearRect", "beginPath", "moveTo", "lineTo", "stroke", "beginPath", "arc", "fill"]);

  // The line goes from math (0,0) to (1, 1.5): its pixel height is 1.5 * scale.
  const [, mx, my] = ctx.calls.find((c) => c[0] === "moveTo");
  const [, lx, ly] = ctx.calls.find((c) => c[0] === "lineTo");
  const scale = (lx - mx);                       // x runs 0 -> 1, so this is the scale
  assert.ok(scale > 0);
  assert.ok(Math.abs((my - ly) - 1.5 * scale) < 1e-6, "1 + cos(60) should be 1.5");

  // Everything lands inside the canvas margin.
  for (const v of [mx, lx]) assert.ok(v >= 40 - 1e-9 && v <= 360 + 1e-9);
  for (const v of [my, ly]) assert.ok(v >= 40 - 1e-9 && v <= 360 + 1e-9);
});

test("runWasm fails to instantiate a module that imports an unknown function", async () => {
  // Same module with "cos" renamed to "tan": the host does not provide it.
  const bytes = Buffer.from(buildDrawModule());
  const i = bytes.indexOf(Buffer.from("cos"));
  bytes.write("tan", i);
  await assert.rejects(() => runWasm(Uint8Array.from(bytes), fakeCtx()), WebAssembly.LinkError);
});
