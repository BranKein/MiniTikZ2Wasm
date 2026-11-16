# 폴더 구조 제안

> 상태: **제안 (논의 단계)**. 팀원과 합의된 결정이 아니다. 합의되면 이 문서의 상태를 갱신하고, 바뀌면 [AGENTS.md](../AGENTS.md)도 같이 고친다.

## 한 줄 요약

프로젝트를 세 폴더로 나눈다. 컴파일러 로직은 독립 Python 패키지(`mini-tikz-2-wasm`)에 두고, 백엔드(`web-be`, FastAPI)가 이 패키지를 import 해서 단계별 API를 열고, 프런트엔드(`web-fe`, 순수 HTML/JS)가 그 API를 호출해 결과를 보여 준다.

```
MiniTikZ2Wasm/
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
│   ├── app/main.py            # 단계별 POST /api/{step}
│   └── tests/
└── web-fe/                    # 프런트엔드 (HTML/CSS/JS, 빌드 도구 없음)
    ├── index.html
    ├── css/style.css
    └── js/                    # main, api, canvas, steps, examples, config
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
- `web-fe` 는 컴파일을 하지 않는다. 받은 단계 결과를 그리고, 마지막에 받은 Wasm 만 브라우저에서 실행한다. ([AGENTS.md](../AGENTS.md)의 아키텍처 원칙과 같다.)

## 폴더별 역할

### `mini-tikz-2-wasm/` — 컴파일러 패키지

- 배포 이름 `mini-tikz-2-wasm`, import 이름 `mini_tikz_2_wasm` (src 레이아웃).
- 컴파일러 단계마다 모듈 하나, 함수 하나: `lex`, `parse`, `analyze`, `codegen`.
- `STEPS` 는 `[("lex", lex), ("parse", parse), ...]` 순서 목록이다. 백엔드는 이 목록을 돌며 엔드포인트를 만든다. **단계가 아직 확정되지 않았으므로** 단계를 추가·삭제할 때는 이 목록만 고치면 되게 했다.
- 오류는 `Diagnostic(kind, message, line, column)` 로 모은다. 한 번에 여러 개를 모으는 것은 "구문 오류에서 복구하고 계속 컴파일" 요구사항을 위한 것이다.
- 단계의 입력·출력·오류·케이스 문서는 [compiler-steps/](compiler-steps/README.ko.md)에 둔다. 코드 구조와 문서 구조의 단계 이름을 맞춘다.
- 테스트는 이 패키지 안(`tests/`)에서 `pytest` 로 돌린다. 웹 없이 컴파일러만 검증할 수 있다.

### `web-be/` — 백엔드

- FastAPI 앱. `mini-tikz-2-wasm` 을 의존성으로 import 한다.
- 엔드포인트
  - `GET /health`
  - `GET /api/steps` — 단계 이름 목록 (프런트가 단계 상자를 만드는 데 쓸 수 있다)
  - `POST /api/{step}` — body `{"source": "..."}`. 소스에서 해당 단계까지 실행한 결과를 돌려준다. ([demo-web-design.md](demo-web-design.ko.md)의 "단계별 백엔드 API 하나씩"에 해당)
- 응답 규약(제안)
  - 성공: `{"ok": true, "result": ...}`
  - 컴파일 오류: HTTP 200, `{"ok": false, "diagnostics": [{kind, message, line, column}, ...]}`
  - 미구현 단계: HTTP 501 (스캐폴딩 상태)
- 코드 생성 결과(바이트)는 JSON 에 넣기 위해 base64 로 인코딩해 줄 예정이다 (`result_base64`).
- CORS: 개발 중 프런트(`localhost:5173`)에서 백엔드(`localhost:8000`)를 호출하므로 허용해 둔다.

### `web-fe/` — 프런트엔드

- React 없이 정적 HTML/CSS/JS(ES module). 번들러·npm 없음. `python3 -m http.server 5173` 으로 띄운다.
- 레이아웃은 [demo-web-design.md](demo-web-design.ko.md) 구상(입력 상자, 예제 버튼, 캔버스, 단계별 결과 상자)을 따른다.
- 확장 가능해야 하는 두 목록을 데이터로 분리했다: 예제 버튼(`js/examples.js`), 컴파일러 단계(`js/steps.js`). 항목을 추가하면 UI 가 따라 늘어난다.
- `js/canvas.js` 가 Wasm 이 import 할 그리기 함수(`moveTo`, `lineTo`, `stroke`, …)를 Canvas 2D API 로 감싼다. import 이름은 제안이며 코드 생성 담당과 맞춰야 한다.

## 개발 흐름 (로컬)

```
# 1) 컴파일러 패키지 + 백엔드 설치 (가상환경 안에서)
pip install -e ./mini-tikz-2-wasm[dev]
pip install -e ./web-be[dev]

# 2) 백엔드 실행 (:8000)
cd web-be && uvicorn app.main:app --reload --port 8000

# 3) 프런트 실행 (:5173)
cd web-fe && python3 -m http.server 5173
```

패키지는 editable 설치라서 컴파일러 코드를 고치면 백엔드 `--reload` 에 바로 반영된다.

## 이렇게 나눈 이유 / 장단점

- 장점
  - 컴파일러 로직이 웹과 분리되어 단위 테스트와 팀원 간 역할 분담이 쉽다 (컴파일러 / 백엔드 / 프런트).
  - 발표 때 "단계별 API" 구조가 코드에서도 그대로 보인다.
  - 프런트는 빌드 과정이 없어 가볍다.
- 단점·주의
  - 폴더 세 개를 따로 설치·실행해야 한다 (위 개발 흐름 참고).
  - 백엔드가 단계 함수를 체인으로 다시 호출하는 방식이라, 단계가 늘면 중복 실행이 생길 수 있다. 처음엔 단순함을 우선한다.

## 열린 질문 (논의 필요)

1. 폴더 이름과 패키지 이름(`mini-tikz-2-wasm` / `mini_tikz_2_wasm`)이 괜찮은가?
2. 백엔드가 프런트 정적 파일도 같이 서빙할지(포트 하나), 지금처럼 분리할지(CORS 필요).
3. 컴파일러 단계 목록 확정: `lex / parse / analyze / codegen` 외에 파스 트리 출력, 심볼 테이블 출력 등을 별도 단계로 둘지 ([compiler-steps/proposal.md](compiler-steps/proposal.ko.md) 참고).
4. Wasm import 함수의 이름과 시그니처.
5. 패키지 관리 도구: 지금은 `pip` + `pyproject.toml`. `uv` 등을 쓸지.
6. Python 최소 버전 (현재 3.10 이상으로 가정).
