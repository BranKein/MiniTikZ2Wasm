import { callStep } from "./api.js";

// Runs STEPS in order, feeding each step's output to the next as `input`.
// Callbacks (all optional):
//   onStart(index)                    a step is about to be called
//   onOutput(index, output)           a step succeeded
//   onFail(index, { status, body })   a step failed or reported errors; the pipeline stops
// Resolves to `{ ok, failedAt?, errors? }`.
export async function runPipeline(steps, source, canvas, { onStart, onOutput, onFail }) {
  let input = source;
  for (const [index, step] of steps.entries()) {
    onStart?.(index);
    const { status, body } = await callStep(step, { input });
    if (status !== 200 || body.errors?.length) {
      onFail?.(index, { status, body });
      return { ok: false, failedAt: index, errors: body.errors };
    }
    const output = (step.getOutput ?? ((b) => b.output))(body);
    onOutput?.(index, output);
    await step.onResult?.({ output, body, canvas });
    input = output;
  }
  return { ok: true };
}
