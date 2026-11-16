# 프로젝트 제안서

## 프로젝트 이름

MiniTikZ2Wasm

## 프로젝트 상세

### 컴파일러/언어는 무엇을 하는가? 소스 언어와 타깃은 무엇인가?

MiniTikZ2Wasm은 TikZ의 작은 부분집합이자 변형인 MiniTikZ로 작성한 그래프 그림을, 웹 페이지에 그림을 그려 주는 WebAssembly 바이너리로 컴파일한다.

- **소스 언어: MiniTikZ.** 명령은 세 가지(`\node`, `\draw`, `\foreach`), 경로는 직선(`--`), 좌표는 산술식 또는 node 이름이다. 식은 `+ - * /`, 괄호, `sin`, `cos`, `sqrt`, `\foreach` 루프 변수를 지원한다.
- **타깃: WebAssembly 바이너리 모듈(`.wasm`).** 모듈은 `draw` 함수를 export하고, 브라우저 Canvas 2D API를 감싼 그리기 함수 몇 개(`moveTo`, `lineTo`, `stroke`, …)를 import한다.
- **사용자가 보는 것:** 사용자는 웹 페이지의 텍스트 상자에 MiniTikZ 코드를 입력한다. 컴파일러의 각 단계는 브라우저 밖(백엔드 서버)에서 실행되고 텍스트 상자 아래에 시각화된다. 생성된 모듈은 텍스트 상자 옆 캔버스에 LaTeX TikZ와 비슷한 그림을 그린다. 에러는 line, column 위치와 함께 보여준다.

### 각 계층의 입력 테스트와 기대 출력

컴파일러 각 계층의 예제 입력과 기대 출력.

예제 MiniTikZ 프로그램:

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

1. **Lexer**
   - 입력: MiniTikZ 소스 코드.
   - 출력: `FOREACH`, `DRAW`, `VAR`, `NUMBER`, 산술 연산자 등의 토큰과 소스 위치.
2. **Parser**
   - 입력: 토큰 스트림.
   - 출력: `Draw` 명령 하나와 좌표 두 개를 담은 `Foreach` 루프를 나타내는 AST.
3. **Semantic Analysis**
   - 입력: AST.
   - 출력: 변수, node, 그리기 옵션을 검증한 타입 주석 AST. 정의되지 않은 node 참조는 에러가 된다(예: `undefined node 'b'`).
4. **Wasm Code Generation**
   - 입력: 최적화된 AST.
   - 출력: `draw` 함수를 export하고 루프를 Wasm 명령으로 컴파일한 유효한 WebAssembly 바이너리 모듈.
5. **Browser Execution**
   - 입력: 생성된 Wasm 모듈.
   - 출력: HTML Canvas에 x = 0, 1, 2, 3 위치의 세로선 네 개, 그리고 x = 0 선의 양 끝점에 검은 점.
