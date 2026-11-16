// Example buttons. Add `{ name, code }` and a button appears; clicking fills the input box.
export const EXAMPLES = [
  {
    name: "Reference",
    code: `\\begin{tikzpicture}
  \\node (A) at (0,0) {};
  \\node (B) at (0,2) {};
  \\draw (A) -- (B);
  \\foreach \\i in {1,...,3} {
    \\draw (\\i, 0) -- (\\i, {1 + cos(60)});
  }
\\end{tikzpicture}`,
  },
];
