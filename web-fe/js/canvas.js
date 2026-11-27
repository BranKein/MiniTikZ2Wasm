// Import contract (docs/wasm-canvas-api.md): all coordinates are f64 math coordinates; the host
// converts to pixels. `sin` and `cos` take degrees (TikZ convention); Wasm has `f64.sqrt` itself.
const DEG = Math.PI / 180;

// Auto-fit settings (pixels). The figure is scaled to fit the canvas inside MARGIN, never above
// MAX_SCALE, so a tiny figure is not blown up.
const MARGIN = 40;
const MAX_SCALE = 100;
const DEFAULT_SCALE = 80;

const sinDeg = (degrees) => Math.sin(degrees * DEG);
const cosDeg = (degrees) => Math.cos(degrees * DEG);

// Real imports: draw on `ctx` through `view` ({ scale, originX, originY }).
export function makeCanvasImports(ctx, view) {
  if (view === undefined) {
    view = { scale: DEFAULT_SCALE, originX: MARGIN, originY: ctx.canvas.height - MARGIN };
  }
  const tx = (x) => view.originX + x * view.scale;
  const ty = (y) => view.originY - y * view.scale;
  return {
    moveTo: (x, y) => ctx.moveTo(tx(x), ty(y)),
    lineTo: (x, y) => ctx.lineTo(tx(x), ty(y)),
    stroke: () => ctx.stroke(),
    sin: sinDeg,
    cos: cosDeg,
    // The circle radius is in canvas pixels.
    fillCircle: (x, y, r) => { ctx.beginPath(); ctx.arc(tx(x), ty(y), r, 0, Math.PI * 2); ctx.fill(); },
  };
}

// Measuring imports: draw nothing, push every finite math point into `points` ([x, y] pairs).
export function makeRecordingImports(points) {
  const add = (x, y) => { if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]); };
  return { moveTo: add, lineTo: add, stroke: () => {}, sin: sinDeg, cos: cosDeg, fillCircle: add };
}

// Choose a view that centers the bounding box of `points` on a width x height canvas.
export function fitView(points, width, height) {
  if (points.length === 0) {
    return { scale: DEFAULT_SCALE, originX: MARGIN, originY: height - MARGIN };
  }
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  const availW = width - 2 * MARGIN, availH = height - 2 * MARGIN;
  // A zero extent (single point, or a straight horizontal/vertical line) does not limit the scale.
  const scaleX = w > 0 ? availW / w : Infinity;
  const scaleY = h > 0 ? availH / h : Infinity;
  const scale = Math.min(scaleX, scaleY, MAX_SCALE);
  return {
    scale,
    originX: MARGIN + (availW - w * scale) / 2 - minX * scale,
    originY: MARGIN + (availH - h * scale) / 2 + maxY * scale,
  };
}

// Run the module twice: a measuring pass (no drawing) to pick the view, then the real pass.
// `draw` must therefore be deterministic and have no effect except through the imports.
export async function runWasm(bytes, ctx) {
  const { width, height } = ctx.canvas;
  const points = [];
  const measure = await WebAssembly.instantiate(bytes, { env: makeRecordingImports(points) });
  measure.instance.exports.draw();
  const view = fitView(points, width, height);

  const { instance } = await WebAssembly.instantiate(bytes, { env: makeCanvasImports(ctx, view) });
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  instance.exports.draw();
}
