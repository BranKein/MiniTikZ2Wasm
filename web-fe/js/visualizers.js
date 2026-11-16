// Output visualizers. A visualizer is `(container, data) => void` that renders a step's output
// into `container`. Register new ones here (e.g. `tree`) and reference them by key in steps.js.
function text(container, data) {
  const pre = document.createElement("pre");
  pre.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  container.replaceChildren(pre);
}

export const VISUALIZERS = { text };
