# web-be

From the repository root:

```sh
uv sync --all-packages
uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be
uv run --package web-be pytest
docker compose up --build
```

Open http://localhost:8000; the backend serves the front end.
