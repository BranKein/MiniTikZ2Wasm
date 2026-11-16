# web-be

([English](README.md)) 컴파일러 패키지를 먼저 설치한다:

```sh
pip install -e ../mini-tikz-2-wasm
pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
pytest
```
