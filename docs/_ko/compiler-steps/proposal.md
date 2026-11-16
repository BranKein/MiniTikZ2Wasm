# 컴파일러 단계 제안 (논의용)

친구와 의논하기 위한 초안이다. 확정이 아니며, 단계 구성이 정해지면 단계별 폴더와 설명 문서를 만든다([README.md](README.md) 참고).

- constant folding(상수 접기)은 하지 않기로 했다.
- 단계는 나중에 추가·변경할 수 있게 만든다.

## 제안하는 단계

| # | 단계 | Input | Output |
|---|---|---|---|
| 1 | Lexer | raw MiniTikZ 텍스트 | 토큰 목록(위치 포함) |
| 2 | Parser | 토큰 목록 | parse tree |
| 3 | AST 변환 | parse tree | AST |
| 4 | Semantic analysis | AST | 검증된 AST + symbol table |
| 5 | Wasm codegen | 검증된 AST | `.wasm` 바이너리(+ 화면 표시용 텍스트 형태) |
| 6 | Browser 실행 | `.wasm` | 캔버스에 그려진 그림 |

1~5단계는 각각 별도의 백엔드 API로 만들고, 6단계는 브라우저에서 실행한다.

## 단계별 설명

1. **Lexer**
   - `\draw`, `\i`, 숫자, `--`, 연산자 등을 토큰으로 자른다.
   - 에러: 정의되지 않은 문자. 그 문자만 건너뛰고 계속한다.
2. **Parser**
   - 토큰이 문법(CFG)에 맞는지 보고 parse tree를 만든다.
   - 에러: syntax error. 틀린 문장만 건너뛰고 뒤를 계속 파싱한다.
3. **AST 변환**
   - parse tree에서 괄호, 세미콜론, 중간 규칙 노드를 없애고 Foreach, Draw, Node, 식만 남긴다.
   - 수업 요구사항(parse tree 다음에 AST도 보여줄 것)에 대응한다.
4. **Semantic analysis**
   - `\node`가 정의한 이름을 symbol table에 모은다. 간단하게 만들고, 커지면 BST로 바꿀 수 있다.
   - 에러: 없는 node를 `\draw`에서 참조, 정의되지 않은 루프 변수, 0으로 나누기.
   - 0으로 나누기는 `1/0`뿐 아니라 `1/(2-2)`처럼 계산해야 0이 되는 상수 식도 잡아야 한다. AST는 바꾸지 않고 상수 식만 계산해서 검사한다([../project-notes.md](../project-notes.md) 참고).
5. **Wasm codegen**
   - AST를 순회하며 Wasm 명령으로 바꾼다.
   - `\foreach`는 Wasm 루프로, 식은 Wasm 연산으로 만든다.
   - `moveTo`, `lineTo`, `stroke`는 import로 호출하고, `draw` 함수를 export한다.
6. **Browser 실행**
   - 브라우저에서 `.wasm`을 돌려 캔버스에 그린다.
   - 에러가 있으면 같은 자리에 에러 로그를 보여준다.

## 같이 정할 것

- 이 6단계 구성으로 갈지. 3번(AST 변환)을 2번 Parser에 합칠 수도 있지만, parse tree와 AST를 따로 보여줘야 하므로 분리를 제안한다.
- 단계별 담당 나누기.
- 에러가 있을 때 그래프를 아예 안 그릴지, 에러 부분만 빼고 그릴지.
