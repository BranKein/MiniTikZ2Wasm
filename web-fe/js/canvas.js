// Import contract: all coordinates are f64 math coordinates; the host converts to pixels.
export function makeCanvasImports(ctx, view) {
  if (view === undefined) {
    view = { scale: 80, originX: 40, originY: ctx.canvas.height - 40 };
  }
  const tx = (x) => view.originX + x * view.scale;
  const ty = (y) => view.originY - y * view.scale;
  return {
    moveTo: (x, y) => ctx.moveTo(tx(x), ty(y)),
    lineTo: (x, y) => ctx.lineTo(tx(x), ty(y)),
    stroke: () => ctx.stroke(),
    // The circle radius is in canvas pixels.
    fillCircle: (x, y, r) => { ctx.beginPath(); ctx.arc(tx(x), ty(y), r, 0, Math.PI * 2); ctx.fill(); },
  };
}

export async function runWasm(bytes, ctx) {
  const { instance } = await WebAssembly.instantiate(bytes, { env: makeCanvasImports(ctx) });
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  instance.exports.draw();
}
