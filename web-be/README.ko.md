# web-be

([English](README.md)) 저장소 루트에서 실행한다:

```sh
uv sync --all-packages
uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be
uv run --package web-be pytest
docker compose up --build
```

http://localhost:8000 을 연다. 백엔드가 프런트엔드를 제공한다.
