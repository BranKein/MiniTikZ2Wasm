import { EXAMPLES } from "./examples.js";
import { runPipeline } from "./pipeline.js";
import { STEPS } from "./steps.js";
import { VISUALIZERS } from "./visualizers.js";

const source = document.querySelector("#source");
const runButton = document.querySelector("#run");
const canvas = document.querySelector("#canvas");
const errorLog = document.querySelector("#error-log");
const boxes = [];

for (const example of EXAMPLES) {
  const button = document.createElement("button");
  button.textContent = example.name;
  button.addEventListener("click", () => { source.value = example.code; });
  document.querySelector("#example-buttons").append(button);
}

for (const step of STEPS) {
  const box = document.createElement("section");
  box.className = "step";
  box.innerHTML = `<h2></h2><div class="step-body"></div>`;
  box.querySelector("h2").textContent = step.name;
  document.querySelector("#steps").append(box);
  boxes.push({ box, body: box.querySelector(".step-body") });
}

// The right panel doubles as the graph and the error log.
function showCanvas() {
  errorLog.hidden = true;
  canvas.hidden = false;
}

function showErrors(text) {
  canvas.hidden = true;
  errorLog.hidden = false;
  errorLog.textContent = text;
}

function formatDiagnostics(diagnostics) {
  return diagnostics.map(({ kind, line, column, message }) => `${line}:${column} ${kind ? `[${kind}] ` : ""}${message}`).join("\n");
}

function resetSteps() {
  for (const { box, body } of boxes) {
    box.dataset.state = "idle";
    body.replaceChildren();
  }
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  resetSteps();
  showCanvas();
  try {
    await runPipeline(STEPS, source.value, canvas, {
      onStart: (i) => { boxes[i].box.dataset.state = "running"; },
      onOutput: (i, output) => {
        boxes[i].box.dataset.state = "done";
        VISUALIZERS[STEPS[i].visualizer](boxes[i].body, output);
      },
      onFail: (i, { status, body }) => {
        boxes[i].box.dataset.state = "failed";
        if (body.diagnostics) {
          showErrors(formatDiagnostics(body.diagnostics));
        } else {
          const message = status === 501 ? "not implemented yet" : (body.error ?? `HTTP ${status}`);
          VISUALIZERS.text(boxes[i].body, message);
        }
      },
    });
  } catch (error) {
    showErrors(error.message);
  } finally {
    runButton.disabled = false;
  }
});
