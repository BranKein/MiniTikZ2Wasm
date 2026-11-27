// Compiler steps, in execution order. The page builds one result box per entry and calls
// each step's API in this order; just add an object to grow the pipeline.
//
// Step object:
//   name        display name of the result box
//   url         backend API path (POST)
//   visualizer  key into VISUALIZERS (visualizers.js)
//   getOutput   optional, `(responseBody) => value`; the value is shown by the visualizer and
//               passed as `input` to the next step. Default: `body.output`.
//   onResult    optional, `({ output, body, canvas }) => void | Promise`; side effect after a
//               successful call (e.g. run the Wasm on the canvas).
//
// Request body sent to every step: `{ input }`, the previous step's output (the MiniTikZ source for
// the first step). Response: `{ output, errors }`; a non-empty `errors` stops the pipeline.
import { runWasm } from "./canvas.js";

export const STEPS = [
  { name: "Lexer", url: "/api/lex", visualizer: "text" },
  { name: "Parser", url: "/api/parse", visualizer: "text" },
  { name: "AST", url: "/api/ast", visualizer: "text" },
  { name: "Semantic analysis", url: "/api/analyze", visualizer: "text" },
  {
    name: "Wasm codegen",
    url: "/api/codegen",
    visualizer: "text",
    onResult: ({ output, canvas }) => {
      if (!output?.wasmBase64) return;
      const bytes = Uint8Array.from(atob(output.wasmBase64), (char) => char.charCodeAt(0));
      return runWasm(bytes, canvas.getContext("2d"));
    },
  },
];
