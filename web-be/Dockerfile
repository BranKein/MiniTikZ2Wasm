FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.8 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy WEB_FE_DIR=/app/web-fe
WORKDIR /app

# uv.lock pins exact dependency versions (--frozen fails if it is out of date).
COPY pyproject.toml uv.lock .python-version ./
COPY mini-tikz-2-wasm ./mini-tikz-2-wasm
COPY web-be ./web-be
COPY web-fe ./web-fe
RUN uv sync --frozen --no-dev --package web-be

EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "web-be"]
