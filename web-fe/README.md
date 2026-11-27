# web-fe

The backend serves this front end; no separate static server is needed.

Start the backend from the repository root, then open http://localhost:8000.
Edit these files and refresh the browser to see changes.

Tests (Node 18+, no install): `node --test web-fe/tests/canvas.test.mjs`. They check the Canvas host (`js/canvas.js`: pixel conversion, `sin`/`cos` in degrees, auto-fit view) with a hand-assembled Wasm module.
