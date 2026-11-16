// add more examples here; buttons are generated from this list
export const EXAMPLES = [{
  id: "reference",
  label: "Reference",
  source: `\\begin{tikzpicture}
  \\node (A) at (0,0) {};
  \\node (B) at (0,2) {};
  \\draw (A) -- (B);
  \\foreach \\i in {1,...,3} {
    \\draw (\\i, 0) -- (\\i, {1 + cos(60)});
  }
\\end{tikzpicture}`,
}];
