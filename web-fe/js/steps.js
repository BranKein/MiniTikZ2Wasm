// Compiler steps, in execution order. The page builds one result box per entry and calls
// each step's API in this order; just add an object to grow the pipeline.
//
// Step object:
//   name        display name of the result box
//   url         backend API path (POST)
//   visualizer  key into VISUALIZERS (visualizers.js)
//   getOutput   optional, `(responseBody) => value`; the value is shown by the visualizer and
//               passed as `input` to the next step. Default: `body.result`.
//   onResult    optional, `({ output, body, canvas }) => void | Promise`; side effect after a
//               successful call (e.g. run the Wasm on the canvas).
//
// Request body sent to every step: `{ source, input }`
//   source  the original MiniTikZ code
//   input   the previous step's output (equals `source` for the first step)
import { runWasm } from "./canvas.js";

export const STEPS = [
  { name: "Lexer", url: "/api/lex", visualizer: "text" },
  { name: "Parser", url: "/api/parse", visualizer: "text" },
  { name: "Semantic analysis", url: "/api/analyze", visualizer: "text" },
  {
    name: "Wasm codegen",
    url: "/api/codegen",
    visualizer: "text",
    getOutput: (body) => body.result_base64 ?? body.result,
    onResult: ({ body, canvas }) => {
      if (!body.result_base64) return;
      const bytes = Uint8Array.from(atob(body.result_base64), (char) => char.charCodeAt(0));
      return runWasm(bytes, canvas.getContext("2d"));
    },
  },
];
