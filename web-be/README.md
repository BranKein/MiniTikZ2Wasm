# web-be

Install the compiler package first:

```sh
pip install -e ../mini-tikz-2-wasm
pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
pytest
```
