// Import names are a proposal, to be agreed.
export function makeCanvasImports(ctx) {
  return {
    moveTo: (x, y) => ctx.moveTo(x, y),
    lineTo: (x, y) => ctx.lineTo(x, y),
    stroke: () => ctx.stroke(),
    beginPath: () => ctx.beginPath(),
    fillCircle: (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); },
  };
}

export async function runWasm(bytes, ctx) {
  const { instance } = await WebAssembly.instantiate(bytes, { env: makeCanvasImports(ctx) });
  instance.exports.draw();
}
