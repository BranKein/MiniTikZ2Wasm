# 폴더 구조

> 상태: **결정됨**. 아래 폴더 구조는 팀원과 합의했다. 컴파일러 단계 목록은 아직 열려 있다(맨 끝 참고). 바뀌면 [AGENTS.md](../../AGENTS.md)도 같이 고친다.

## 한 줄 요약

프로젝트를 세 폴더로 나눈다. 컴파일러 로직은 독립 Python 패키지(`mini-tikz-2-wasm`)에 두고, 백엔드(`web-be`, FastAPI)가 이 패키지를 import 해서 단계별 API를 열고, 프런트엔드(`web-fe`, 순수 HTML/JS)가 그 API를 호출해 결과를 보여 준다.

```
MiniTikZ2Wasm/
├── pyproject.toml             # uv 워크스페이스 루트 (멤버: mini-tikz-2-wasm, web-be)
├── docker-compose.yml         # 서비스 하나: 백엔드 + 정적 프런트
├── docs/                      # 기획·설계 문서
├── mini-tikz-2-wasm/          # 컴파일러 (Python 패키지)
│   ├── pyproject.toml
│   ├── src/mini_tikz_2_wasm/
│   │   ├── __init__.py        # STEPS 목록과 공개 API
│   │   ├── errors.py          # Diagnostic(kind, message, line, column), CompileError
│   │   ├── lexer.py           # lex(source) -> tokens
│   │   ├── parser.py          # parse(tokens) -> AST
│   │   ├── ast_nodes.py       # AST 노드 정의
│   │   ├── symbol_table.py    # 심볼 테이블 (BST 가능)
│   │   ├── semantic.py        # analyze(ast) -> 타입 주석 AST
│   │   └── codegen.py         # codegen(ast) -> .wasm bytes
│   └── tests/
├── web-be/                    # 백엔드 (FastAPI)
│   ├── pyproject.toml
│   ├── Dockerfile             # 빌드 컨텍스트는 레포 루트
│   ├── app/main.py            # 단계별 POST /api/{step} + web-fe 서빙
│   └── tests/
└── web-fe/                    # 프런트엔드 (HTML/CSS/JS, 빌드 도구 없음)
    ├── index.html
    ├── css/style.css
    └── js/                    # main, api, pipeline, steps, visualizers, examples, canvas, config
```

## 의존 방향

```
web-fe  --HTTP(JSON)-->  web-be  --import-->  mini-tikz-2-wasm
(브라우저)               (FastAPI)             (순수 Python)
   ▲                                                │
   └────────── 생성된 .wasm 을 받아 Canvas 에 실행 ◄──┘
```

- `mini-tikz-2-wasm` 은 웹을 모른다. FastAPI 등 외부 의존성이 없다.
- `web-be` 는 컴파일러 로직을 갖지 않고, 패키지를 호출해 결과를 JSON 으로 감싸기만 한다.
- `web-fe` 는 컴파일을 하지 않는다. 받은 단계 결과를 그리고, 마지막에 받은 Wasm 만 브라우저에서 실행한다. ([AGENTS.md](../../AGENTS.md)의 아키텍처 원칙과 같다.)

## 폴더별 역할

### `mini-tikz-2-wasm/` — 컴파일러 패키지

- 배포 이름 `mini-tikz-2-wasm`, import 이름 `mini_tikz_2_wasm` (src 레이아웃).
- 컴파일러 단계마다 모듈 하나, 함수 하나: `lex`, `parse`, `analyze`, `codegen`.
- `STEPS` 는 `[("lex", lex), ("parse", parse), ("ast", build_ast), ...]` 순서 목록이다. 백엔드는 이 목록을 돌며 엔드포인트를 만든다. 모든 단계는 JSON 호환 데이터를 받아 `StepResult(output, errors)` 를 돌려준다. **단계가 아직 확정되지 않았으므로** 단계를 추가·삭제할 때는 이 목록만 고치면 되게 했다.
- 오류는 `Diagnostic(kind, message, line, column)` 로 모은다. 한 번에 여러 개를 모으는 것은 "구문 오류에서 복구하고 계속 컴파일" 요구사항을 위한 것이다.
- 단계의 입력·출력·오류·케이스 문서는 [compiler-steps/](compiler-steps/README.md)에 둔다. 코드 구조와 문서 구조의 단계 이름을 맞춘다.
- 테스트는 이 패키지 안(`tests/`)에서 `pytest` 로 돌린다. 웹 없이 컴파일러만 검증할 수 있다.

### `web-be/` — 백엔드

- FastAPI 앱. `mini-tikz-2-wasm` 을 의존성으로 import 한다.
- 엔드포인트
  - `GET /health`
  - `GET /api/steps` — 단계 이름 목록 (프런트가 단계 상자를 만드는 데 쓸 수 있다)
  - `POST /api/{step}` — body `{"input": ...}`: 첫 단계는 MiniTikZ 소스, 나머지는 이전 단계의 `output`. 해당 단계의 패키지 함수만 호출한다. ([demo-web-design.md](demo-web-design.md)의 "단계별 백엔드 API 하나씩"에 해당)
- 응답 규약
  - HTTP 200, `{"output": ..., "errors": [{kind, message, line, column}, ...]}`. 성공이면 `errors` 가 비어 있고, 오류가 있으면 `output` 은 복구된 부분 결과이거나 `null` 이다
  - 미구현 단계: HTTP 501 (스캐폴딩 상태)
- 코드 생성 결과(바이트)는 JSON 에 넣기 위해 base64 로 인코딩해 준다: `output` 이 `{"wasmBase64": "..."}` 가 된다.
- 정적 파일: 백엔드가 `web-fe/` 도 `/` 에서 같이 서빙한다 (FastAPI `StaticFiles`, API 라우트 뒤에 마운트). 프런트와 API 가 같은 origin·같은 포트(8000)라 CORS 설정이 필요 없다. 폴더는 환경변수 `WEB_FE_DIR` 로 바꿀 수 있다.
- Docker: `web-be/Dockerfile`(빌드 컨텍스트 = 레포 루트)과 `docker-compose.yml` 로 백엔드와 정적 프런트를 컨테이너 하나로 띄운다.

### `web-fe/` — 프런트엔드

- React 없이 정적 HTML/CSS/JS(ES module). 번들러·npm 없음. 백엔드가 서빙하므로 별도 서버가 없고, API 호출은 상대 경로를 쓴다.
- 레이아웃은 [demo-web-design.md](demo-web-design.md) 구상(입력 상자, 예제 버튼, 캔버스, 단계별 결과 상자)을 따른다.
- 확장 가능해야 하는 두 목록을 데이터로 분리했다. 항목을 추가하면 UI 가 따라 늘어난다.
  - 예제 버튼: `js/examples.js`, 항목 `{ name, code }`. 버튼을 누르면 입력 상자가 채워진다.
  - 컴파일러 단계: `js/steps.js`, 항목 `{ name, url, visualizer }`와 선택 항목 `getOutput`(응답에서 출력값 고르기, 기본 `body.output`), `onResult`(성공 후 부수 효과, 예: 캔버스에서 Wasm 실행). `js/pipeline.js` 가 목록 순서대로 단계를 호출하고, 요청 body `{ input }` 을 보낸다. `input` 은 이전 단계의 출력이다(첫 단계는 소스). `errors` 가 비어 있지 않으면 파이프라인이 멈춘다.
  - 출력 visualizer: `js/visualizers.js` 는 이름으로 찾는 레지스트리이고, 단계가 `visualizer` 로 하나를 고른다. 지금은 `text` 뿐이며, 트리 보기 같은 것은 레지스트리에 추가한다.
- 오른쪽 패널은 캔버스를 보여 주다가, 단계가 errors 를 돌려주면 오류 로그(줄·열 포함)를 보여 준다.
- `js/canvas.js` 가 Wasm 이 import 할 그리기 함수(`moveTo`, `lineTo`, `stroke`, …)를 Canvas 2D API 로 감싼다. import 계약은 아래 "결정"을 본다.

## 개발 흐름 (로컬)

```
# 레포 루트에서
uv sync --all-packages                 # 두 패키지 + 개발 도구 설치
uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be
# http://localhost:8000 을 연다        (API + 프런트)

uv run --package mini-tikz-2-wasm pytest   # 컴파일러 테스트
uv run --package web-be pytest             # 백엔드 테스트

# 또는 Docker 로
docker compose up --build
```

워크스페이스 멤버는 editable 로 설치되므로 컴파일러 코드를 고치면 백엔드 `--reload` 에 바로 반영된다.

## 이렇게 나눈 이유 / 장단점

- 장점
  - 컴파일러 로직이 웹과 분리되어 단위 테스트와 팀원 간 역할 분담이 쉽다 (컴파일러 / 백엔드 / 프런트).
  - 발표 때 "단계별 API" 구조가 코드에서도 그대로 보인다.
  - 프런트는 빌드 과정이 없어 가볍다.
- 단점·주의
  - Python 패키지 두 개와 프런트 폴더로 나뉜다. uv 워크스페이스와 Docker 가 대부분 가려 주지만 앱 하나일 때보다 움직이는 부분이 많다.
  - 백엔드가 단계 함수를 체인으로 다시 호출하는 방식이라, 단계가 늘면 중복 실행이 생길 수 있다. 처음엔 단순함을 우선한다.

## 결정 (합의됨)

1. **이름:** `mini-tikz-2-wasm`(폴더·배포 이름)과 `mini_tikz_2_wasm`(import 이름)을 유지한다.
2. **서빙:** 프로젝트 폴더는 지금처럼 나누되, 백엔드가 `web-fe/` 정적 파일을 서빙한다 (origin·포트 하나, CORS 없음). Docker 와 docker compose 를 제공한다.
3. **Wasm import:** `moveTo(x, y)`, `lineTo(x, y)`, `stroke()`, `fillCircle(x, y, r)`, `sin(deg)`, `cos(deg)` (도 단위, `f64 -> f64`; `sqrt` 는 Wasm 의 `f64.sqrt` 를 쓴다). 좌표는 f64 수학 좌표이고, JavaScript 호스트가 캔버스 픽셀로 바꾼다 (y 축 뒤집기, 스케일). `r` 은 픽셀 단위다. 모듈은 `draw()` 를 export 한다.
4. **도구:** 레포 루트에 워크스페이스를 둔 `uv`.
5. **Python:** 3.11 이상.

## 열린 질문

1. **컴파일러 단계 목록.** 6단계(`lex / parse / ast / analyze / codegen` + 브라우저 실행)로 가는 쪽으로 기울어 있지만, [compiler-steps/proposal.md](compiler-steps/proposal.md) 의 단계 논의에서 함께 결정한다. 지금 패키지와 백엔드는 5단계(`lex / parse / ast / analyze / codegen`)이고, 브라우저 실행은 프런트에 있다.
