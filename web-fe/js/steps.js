// keep in sync with backend GET /api/steps; list is not final
export const STEPS = [
  { id: "lex", label: "Lexer" },
  { id: "parse", label: "Parser" },
  { id: "analyze", label: "Semantic analysis" },
  { id: "codegen", label: "Wasm codegen" },
];
