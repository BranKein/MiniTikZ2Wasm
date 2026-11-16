import { callStep } from "./api.js";
import { runWasm } from "./canvas.js";
import { EXAMPLES } from "./examples.js";
import { STEPS } from "./steps.js";

const source = document.querySelector("#source");
const errors = document.querySelector("#errors");
const results = document.querySelector("#step-results");
const ctx = document.querySelector("#canvas").getContext("2d");
const boxes = new Map();

for (const example of EXAMPLES) {
  const button = document.createElement("button");
  button.textContent = example.label;
  button.addEventListener("click", () => { source.value = example.source; });
  document.querySelector("#example-buttons").append(button);
}

for (const step of STEPS) {
  const details = document.createElement("details");
  details.innerHTML = `<summary>${step.label}</summary><pre></pre>`;
  results.append(details);
  boxes.set(step.id, details.querySelector("pre"));
}

function showDiagnostics(diagnostics = []) {
  errors.textContent = diagnostics.map(({ line, column, message }) => `${line}:${column} ${message}`).join("\n");
}

document.querySelector("#run").addEventListener("click", async () => {
  errors.textContent = "";
  for (const box of boxes.values()) box.textContent = "";
  for (const step of STEPS) {
    try {
      const { status, body } = await callStep(step.id, source.value);
      boxes.get(step.id).textContent = status === 501 ? "not implemented yet" : JSON.stringify(body, null, 2);
      if (body.diagnostics) showDiagnostics(body.diagnostics);
      if (status !== 200 || body.ok === false) return;
      if (step.id === "codegen" && body.result_base64) {
        try {
          const bytes = Uint8Array.from(atob(body.result_base64), (char) => char.charCodeAt(0));
          await runWasm(bytes, ctx);
        } catch (error) {
          errors.textContent = error.message;
        }
      }
    } catch (error) {
      errors.textContent = error.message;
      return;
    }
  }
});
