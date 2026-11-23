# 컴파일러 단계 문서 (공통)

각 컴파일러 단계(step)가 무엇을 하고, 무엇을 입력으로 받아 무엇을 출력하는지를 단계별 문서로 남기는 폴더다. 이 README는 모든 단계에 공통인 내용만 담는다.

아래 표에 현재 단계 구성의 초안을 정리했다. 단계는 나중에 추가·변경할 수 있어야 한다([../demo-web-design.md](../demo-web-design.md)의 확장성 요구사항 참고).

## 폴더 구조

단계마다 폴더 하나를 `docs/compiler-steps/<번호>-<이름>/` 형태로 만든다. 예: `01-lexer/`. 번호는 실행 순서이며, 단계를 끼워 넣으면 번호를 다시 매긴다.

```
docs/compiler-steps/
├── README.md                 # 이 문서 (공통 규칙, 단계 목록)
├── _template/                # 새 단계 폴더의 원본. 복사해서 쓴다
│   ├── README.md             # 단계 설명 문서의 format
│   └── cases/
│       └── _example/         # 케이스 하나의 format
│           ├── input.txt
│           ├── expected.json
│           └── case.md
└── 01-lexer/                 # 단계 폴더 (예시)
    ├── README.md             # 이 단계 설명: 하는 일, 입력, 출력, 에러, API
    └── cases/
        ├── basic/            # 케이스 하나 = 폴더 하나
        │   ├── input.txt
        │   ├── expected.json
        │   └── case.md
        └── unknown-char/
            └── ...
```

## 케이스 구조

케이스는 그 단계의 예제이자 테스트 케이스다. 케이스 하나는 `cases/<케이스 이름>/` 폴더이고 아래 파일을 둔다.

| 파일 | 필수 | 내용 |
|---|---|---|
| `input.txt` 또는 `input.json` | 필수 | 이 단계의 입력. 첫 단계는 MiniTikZ 소스라 `input.txt`, 이후 단계는 이전 단계의 출력이라 `input.json` |
| `expected.json` | 필수 | 이 단계의 기대 출력. `{ "output": ..., "errors": [...] }` 형태이며, 에러가 없으면 `errors`는 빈 배열 |
| `case.md` | 선택 | 케이스 종류(정상, syntax error, semantic error 등), 확인하려는 것, 데모 예제 버튼으로 쓸지 |

규칙:

- 케이스 이름은 소문자와 `-`로 짓는다. 예: `basic`, `missing-brace`, `divide-by-zero`.
- 기대 출력은 그 단계의 API 응답과 같은 형식으로 쓴다. 그래야 그대로 자동 테스트에 쓸 수 있다.
- 한 케이스의 `expected.json`은 다음 단계 케이스의 `input.json`으로 재사용할 수 있다.
- 데모의 예제 입력 버튼은 이 케이스들에서 만들 수 있도록, 케이스를 데이터로 읽을 수 있는 구조를 유지한다.

## 문서 규칙

- 새 단계는 [_template/](_template/) 폴더를 통째로 복사해서 시작한다.
- 단계 폴더가 추가·삭제·이름 변경되면 아래 "단계 목록" 표도 같이 고친다.

## 공통 원칙

- 초안에서는 컴파일러 5개 단계에 각각 백엔드 API를 두고 데이터를 JSON으로 주고받는다. 브라우저 실행 단계는 생성된 Wasm을 브라우저에서 실행한다.
- 각 단계의 출력은 화면의 단계별 결과 박스에 그대로 보여줄 수 있어야 한다.
- 문법 에러가 있어도 해당 부분만 건너뛰고(에러 기록) 뒤를 계속 처리한다. 에러는 단계마다 line/column과 함께 모아서 반환한다.
- 에러가 있으면 에러 로그를 보여주고, 없으면 그래프를 그린다.
- 최소 2종류 이상의 에러(syntax, semantic)를 보여줘야 한다. 자세한 수업 요구사항은 [../project-notes.md](../project-notes.md)를 본다.

## 단계 목록

| 번호 | 단계 | 폴더 | 상태 |
|---|---|---|---|
| 1 | 렉서 | [`01-lexer/`](01-lexer/README.md) | 초안 |
| 2 | 파서 | [`02-parser/`](02-parser/README.md) | 초안 |
| 3 | AST 변환 | [`03-ast/`](03-ast/README.md) | 초안 |
| 4 | 의미 분석 | [`04-semantic/`](04-semantic/README.md) | 초안 |
| 5 | Wasm 코드 생성 | [`05-codegen/`](05-codegen/README.md) | 초안 |
| 6 | 브라우저 실행 | [`06-browser-execution/`](06-browser-execution/README.md) | 초안 |
