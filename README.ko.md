# MiniTikZ2Wasm

컴파일러 수업 프로젝트. TikZ의 작은 부분집합이자 변형인 **MiniTikZ**를 **WebAssembly** 바이너리로 컴파일해서, HTML Canvas에 그림을 그린다.

English: [README.md](README.md)

> 상태: 초기 스캐폴딩·제안 단계. 폴더 구조와 컴파일러 단계는 아직 논의 중이며 확정된 것이 없다.

## 예제

```
\begin{tikzpicture}
  \node (A) at (0,0) {};
  \node (B) at (0,2) {};
  \draw (A) -- (B);
  \foreach \i in {1,...,3} {
    \draw (\i, 0) -- (\i, {1 + cos(60)});
  }
\end{tikzpicture}
```

기대 렌더: x = 0, 1, 2, 3 위치의 세로선 네 개, 그리고 x = 0 선의 양 끝점에 검은 점.

## 동작 방식

1. 사용자가 웹 페이지에 MiniTikZ 코드를 입력한다.
2. Python 백엔드가 컴파일러 각 단계(Lexer, Parser, Semantic analysis, Wasm 코드 생성)를 실행하고, 페이지가 단계별 결과를 보여 준다.
3. 생성된 `.wasm`이 브라우저에서 실행되어 캔버스에 그린다. 에러는 line, column 위치와 함께 보여 준다.

## 저장소 구조

| 폴더 | 설명 |
|---|---|
| [`mini-tikz-2-wasm/`](mini-tikz-2-wasm/README.ko.md) | 순수 Python 패키지로 만든 컴파일러 |
| [`web-be/`](web-be/README.ko.md) | FastAPI 백엔드: 컴파일러 단계마다 API 하나, 프런트도 같이 서빙 |
| [`web-fe/`](web-fe/README.ko.md) | 순수 HTML/CSS/JS 프런트엔드 (프레임워크·번들러 없음) |
| [`docs/`](docs/_ko/) | 제안서, 노트, 데모 설계, 컴파일러 단계 문서 |

자세한 내용과 열린 질문: [docs/_ko/folder-structure.md](docs/_ko/folder-structure.md).

## 시작하기

[uv](https://docs.astral.sh/uv/)(Python 3.11 이상) 또는 Docker가 필요하다.

```sh
# uv 사용, 레포 루트에서
uv sync --all-packages
uv run --package web-be uvicorn app.main:app --reload --port 8000 --app-dir web-be
# http://localhost:8000 을 연다

# 또는 Docker
docker compose up --build
```

테스트 실행:

```sh
uv run --package mini-tikz-2-wasm pytest
uv run --package web-be pytest
```

## 문서

- [프로젝트 제안서](docs/_ko/project-proposal.md)
- [프로젝트 노트 (수업 제약)](docs/_ko/project-notes.md)
- [데모 웹 구상](docs/_ko/demo-web-design.md)
- [폴더 구조 제안](docs/_ko/folder-structure.md)
- [컴파일러 단계](docs/_ko/compiler-steps/README.md), [단계 제안](docs/_ko/compiler-steps/proposal.md)

## 기여

- 컴파일러 로직: [@6QB6](https://github.com/6QB6). 웹, 백엔드, 테스트: [@BranKein](https://github.com/BranKein).
- 푸시 전에 테스트를 꼭 돌린다.
- 기여자·에이전트 규칙: [AGENTS.md](AGENTS.md).
