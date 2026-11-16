# Demo Web Design (for the presentation)

A rough design of the web page shown in the presentation (demo). The source is the shapes and comments on a Claude Design canvas, transcribed here into a readable form. Details are still undecided and will be filled in later.

- Original canvas: https://claude.ai/artifact/WGsQgXoeFxe1q3fi2tuJCw (private, owner only)
- The canvas has no artboard, only 13 rectangles and 5 comments. Coordinates are canvas px and are the basis of the wireframe below.

## One-line summary

The user enters MiniTikZ code and submits it; the result of each compiler step is printed below the page, step by step, and the final Wasm draws the figure on the canvas on the right.

## Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ [Header] project title area (full width)                  │
├──────────────────────────────────────────────────────────┤
│ [Example buttons (illustrative)]                          │
│ ┌──────────────────────┐   ┌──────────────────────┐      │
│ │ Text input            │   │ Rendered graph        │      │
│ │ (MiniTikZ code)       │   │ (HTML Canvas)         │      │
│ │                      │   │                      │      │
│ │          [Submit]     │   │                      │      │
│ └──────────────────────┘   └──────────────────────┘      │
│ ┌──────────────────────────────────────────────────┐     │
│ │ Step 1 result (larger than the other steps)       │     │
│ └──────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────┐     │
│ │ Step 2 result                                     │     │
│ └──────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────┐     │
│ │ Step 3 result                                     │     │
│ └──────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────┐     │
│ │ Step 4 result                                     │     │
│ └──────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## Areas

| Area | Canvas position (x, y, w×h) | Content |
|---|---|---|
| Whole page | 52, 285, 1591×1839 | Blue-bordered frame. One page |
| Header | 52, 285, 1591×130 | Red band. Project title area |
| Example input buttons (4 as illustration) | y=434, each 125×55 (x=98, 244, 390, 536) | Clicking fills the input box with example code |
| Text input | 98, 504, 688×363 | Where MiniTikZ code is typed |
| Submit button | 651, 882, 135×56 | Bottom right of the input box. Starts compilation |
| Rendered graph | 892, 504, 688×435 | Result drawn by Wasm on an HTML Canvas (whether to use Canvas is not final) |
| Step result boxes (4 as illustration) | x≈99, width 1481 / y=973 (height 347), 1354, 1601, 1848 (207 each) | Output of each compiler step |

## Behavior (from the comments)

- Each compiler step prints its result as is. E.g. text → parse tree, parse tree → next step.
- **Each step is implemented as its own backend API.** Every step has a separate API, and the front end receives each step's result and shows it in its box.
- What goes into the example input buttons is undecided. We are thinking of valid input, syntax error, semantic error, etc. We need examples that show the course requirement (at least 2 kinds of errors, see [project-notes.md](project-notes.md)).

## Error display (decided)

- The "Rendered graph" area on the right doubles as the error log.
  - If there are errors: show the error log there (with line/column positions).
  - If there are no errors: draw the graph there.
- Even with syntax errors, skip only the offending part and keep compiling ([project-notes.md](project-notes.md)). The error log collects and shows all skipped errors.

## Extensibility requirements

- **Example input buttons**: Which examples go in is undecided. Build it so more examples can be added later. E.g. keep the example list as data (array/config file) and generate the buttons from it.
- **Compiler steps**: Which steps exist is also undecided. Build it so steps can be added or changed later. E.g. keep the step list as data and generate each step's API and result box from it.

## Undecided

- The actual number and content of step result boxes. The 4 on the canvas are only an illustration; make as many boxes as there are steps. Candidate steps are Lexer (tokens), Parse tree, AST, Semantic, Wasm. By the requirements the AST must also be shown after the parse tree.
- Whether the render area really is an HTML Canvas. In the proposal, Wasm imports the Canvas 2D API to draw.
- The actual visual design (colors, fonts, etc.). The canvas has layout shapes only.
