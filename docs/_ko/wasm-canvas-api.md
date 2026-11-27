# Wasm ↔ Canvas API (호스트 계약)

> 상태: 그리기 import 4개와 `draw` export 는 **합의됨**. 열린 항목은 맨 끝에 있다. 영문판: [../wasm-canvas-api.md](../wasm-canvas-api.md). 이 계약을 구현한 코드는 [`web-fe/js/canvas.js`](../../web-fe/js/canvas.js)이다. 5단계([Wasm 코드 생성](compiler-steps/README.md))가 맞춰서 생성해야 하는 기준이고, 6단계(브라우저 실행)가 제공해야 하는 기준이다.

## 개요

생성된 Wasm 모듈은 스스로 아무것도 그리지 않는다. 브라우저(호스트)가 제공하는 아주 작은 그리기 함수 4개를 **import** 하고, 함수 하나 `draw` 를 **export** 한다. 호스트가 Canvas 2D API 를 감싸고 수학 좌표를 캔버스 픽셀로 바꿔 주므로, 컴파일러는 수학 좌표만 다루면 된다.

```
 codegen 결과 (.wasm)                           브라우저 호스트 (canvas.js)
┌──────────────────────────┐   import    ┌────────────────────────────────┐
│ draw()  ── 호출 ─────────┼────────────►│ moveTo / lineTo / stroke /     │
│                          │  (모듈      │ fillCircle  ─► Canvas 2D ctx   │
└──────────────────────────┘   "env")    └────────────────────────────────┘
```

## 모듈 계약

### Import

네 개 모두 import 모듈 이름 **`env`** 의 **함수 import** 이다. 이름은 대소문자를 구분한다. 모든 숫자는 `f64` 이고 반환값은 없다.

| Import (`env.`) | Wasm 시그니처 | 의미 |
|---|---|---|
| `moveTo` | `(f64 x, f64 y) -> ()` | 수학 좌표 `(x, y)` 에서 새 서브 경로를 시작한다. 선은 그리지 않는다. |
| `lineTo` | `(f64 x, f64 y) -> ()` | 현재 점에서 수학 좌표 `(x, y)` 까지 직선 구간을 경로에 추가한다. `stroke` 전에는 화면에 보이지 않는다. |
| `stroke` | `() -> ()` | 지금까지 `moveTo`/`lineTo` 로 쌓은 현재 경로를 선으로 그린다. |
| `fillCircle` | `(f64 x, f64 y, f64 r) -> ()` | 수학 좌표 `(x, y)` 가 중심인 채워진 점을 그린다. **`r` 은 수학 단위가 아니라 캔버스 픽셀 단위다.** |

생성 모듈이 지킬 규칙:

- `env` 에서 이 네 이름**만** import 한다. 다른 것을 import 하면 호스트가 제공하는 것이 없어 인스턴스화가 링크 오류로 실패한다.
- 일부만 import 해도 된다 (노드 점을 그리지 않으면 `fillCircle` 은 없어도 된다).
- 호스트는 import 를 인덱스가 아니라 **이름과 시그니처**로 연결한다. 모듈 안의 import 순서와 함수 인덱스는 코드 생성기가 정한다.
- 선언한 시그니처가 위 표와 정확히 같아야 한다(`f64` 매개변수, 반환값 없음). 다르면 인스턴스화가 실패한다.

### Export

| Export | Wasm 시그니처 | 의미 |
|---|---|---|
| `draw` | `() -> ()` | import 를 호출해 그림 전체를 그린다. 호스트가 정확히 한 번 호출한다. |

- 메모리·테이블·전역을 import 하거나 export 할 필요는 없다. 다른 export 는 호스트가 무시한다.
- 그리기에 Wasm `start` 함수를 쓰지 않는다. 인스턴스화 중에, 호스트가 캔버스를 지우기 전에 실행되기 때문이다. 그리기는 모두 `draw` 안에 둔다.

## 좌표

모듈은 **수학 좌표**(`f64`)만 쓴다. x 는 오른쪽으로, y 는 **위쪽**으로 커진다(그래프와 같다). 호스트가 각 점을 이렇게 바꾼다.

```
pixel_x = originX + x * scale
pixel_y = originY - y * scale        (마이너스로 y 축을 뒤집는다. 캔버스 y 는 아래로 커진다)
```

현재 뷰(`canvas.js` 의 `makeCanvasImports`), `index.html` 의 400×400 캔버스 기준:

| 설정 | 값 |
|---|---|
| `scale` | 수학 단위 1 당 80 px |
| `originX` | 40 px |
| `originY` | `canvas.height - 40` = 360 px |
| 보이는 수학 범위 | x ∈ [−0.5, 4.5], y ∈ [−0.5, 4.5] |

그래서 기준 프로그램(x = 0…3, y = 0…2.5)은 들어온다. 범위 밖의 점은 캔버스가 그냥 잘라낸다. 그림에 맞춰 뷰를 자동으로 맞추는 기능은 없다(열린 항목 참고).

점 좌표만 스케일된다. `fillCircle` 의 반지름 `r` 은 **픽셀**이고 스케일되지 않는다.

## 호스트가 모듈을 실행하는 순서

`canvas.js` 의 `runWasm(bytes, ctx)` 가 순서대로 한다.

1. `WebAssembly.instantiate(bytes, { env: { moveTo, lineTo, stroke, fillCircle } })`. import 가 없거나 시그니처가 다르거나 바이트가 잘못됐으면 여기서 실패한다.
2. 캔버스 전체에 `ctx.clearRect(...)`, 이어서 `ctx.beginPath()`.
3. `instance.exports.draw()`.

그리기 스타일은 Canvas 기본값이다: **검정, 1 px 선, 검정 채우기.** 색이나 선 굵기를 바꾸는 import 는 없다.

## 설계 시 주의할 동작

Canvas 2D 경로의 동작에서 나오는 것들이고, 코드 생성기에 중요하다.

1. **`stroke` 는 경로를 비우지 않는다.** 호스트는 `ctx.stroke()` 만 호출한다. 구간이 경로에 남으므로 다음 `stroke` 가 다시 그린다(눈에는 같고 약간 낭비일 뿐). `\draw` 경로마다 `moveTo`, `lineTo`, …, `stroke` 를 한 번씩 낸다.
2. **경로는 항상 `moveTo` 로 시작한다.** `fillCircle` 뒤에는 현재 점이 원의 가장자리이고, 현재 점이 없을 때 `lineTo` 는 `moveTo` 처럼 동작하므로, `moveTo` 가 빠지면 엉뚱한 곳에서 그려진다.
3. **`fillCircle` 은 현재 경로를 초기화한다.** 호스트가 점마다 `beginPath()` + `arc` + `fill` 을 하므로, 추가만 하고 아직 `stroke` 하지 않은 구간은 **사라진다.** 대기 중인 경로는 `fillCircle` **전에** `stroke()` 로 그린다.
4. **경로 `A -- B -- C`** 는 `moveTo(A)`, `lineTo(B)`, `lineTo(C)`, `stroke()` 이다. 서로 다른 `\draw` 는 별도의 `moveTo … stroke` 묶음이다.
5. **잘못된 숫자.** Canvas 는 `NaN` 이나 ±∞ 가 들어간 `moveTo`/`lineTo` 를 무시한다(그 구간만 건너뛰고 오류는 없다). `fillCircle` 의 `r` 이 **음수**면 호스트에서 예외(`IndexSizeError`)가 나고, 그리기/런타임 오류로 드러난다. Wasm `f64` 0 나눗셈은 조용히 ±∞ 나 NaN 이 된다. [compiler-steps/04-semantic](compiler-steps/README.md)과 06 브라우저 실행 문서의 "0 나눗셈"을 본다.
6. **그리는 순서 = 호출 순서.** 나중 호출이 앞의 것 위에 칠해진다.

## 예시

기준 프로그램은 선 하나의 양 끝에 노드 점이 있다. (0,0)에서 (0,2)까지 선 하나와 점들을 그리고 계약을 지키는 모듈의 텍스트 형태는 이렇다.

```wat
(module
  (import "env" "moveTo"     (func $moveTo     (param f64 f64)))
  (import "env" "lineTo"     (func $lineTo     (param f64 f64)))
  (import "env" "stroke"     (func $stroke))
  (import "env" "fillCircle" (func $fillCircle (param f64 f64 f64)))

  (func (export "draw")
    ;; \draw (A) -- (B);   A=(0,0), B=(0,2)
    f64.const 0  f64.const 0  call $moveTo
    f64.const 0  f64.const 2  call $lineTo
    call $stroke                                  ;; 점보다 먼저 stroke

    ;; 노드 점, 반지름 3 px
    f64.const 0  f64.const 0  f64.const 3  call $fillCircle
    f64.const 0  f64.const 2  f64.const 3  call $fillCircle))
```

`\foreach \i in {1,...,3}` 는 `f64` 지역 변수를 도는 Wasm 루프가 되고, 반복마다 `moveTo`, `lineTo`, `stroke` 를 따로 낸다.

```wat
;; i = 1..3 : \draw (i,0) -- (i, 1 + cos(60));   (루프 본문 의사 코드)
local.get $i  f64.const 0                call $moveTo
local.get $i  <1 + cos(60) 의 f64 코드>  call $lineTo
call $stroke
```

## 계약을 바꿀 때

import 를 추가하거나 바꾸면 세 곳이 같이 바뀐다. 함께 고친다.

1. [`web-fe/js/canvas.js`](../../web-fe/js/canvas.js) 의 `makeCanvasImports` (호스트 쪽).
2. 이 문서의 import 표.
3. 코드 생성기와 테스트(`mini-tikz-2-wasm`), 그리고 [folder-structure.md](folder-structure.md)의 결정 3번.

## 열린 항목

1. **모듈에서 `sin` / `cos` 를 쓸 수 없다.** Wasm 에는 `f64.sqrt` 는 있지만 사인·코사인 명령이 없고, 계약에도 수학 import 가 없다. 언어는 `sin`, `cos` 가 필요하다. 선택지: (a) `Math.sin/cos` 로 구현한 호스트 import `env.sin(f64) -> f64`, `env.cos(f64) -> f64` 를 추가한다(가장 간단하며, 이 문서와 `canvas.js` 에 항목 두 개가 늘어난다). (b) Wasm 안에서 다항식 근사를 생성한다. 결정이 필요하다.
2. **도(degree)인지 라디안인지.** 기준 프로그램의 `cos(60)` 은 **도**(TikZ 방식, `1 + cos(60) = 1.5`)를 뜻한다. 호스트 `Math.cos` 는 라디안을 받으므로, 언어 의미를 맡은 쪽이 정해야 한다.
3. **뷰 자동 맞춤.** 뷰가 고정이다(scale 80, 원점 40/360). x, y 가 [−0.5, 4.5] 밖인 그림은 잘린다. 그림에 맞춰 뷰를 고르려면 호스트 쪽에서 경계 상자를 구하는 단계나 추가 import 가 필요하다.
4. **스타일.** 색, 선 굵기, 점 반지름을 정하는 import 는 없다. 점 반지름은 생성기가 고른다(예시는 3 px).
5. **런타임 검사.** 루프 변수에 의존하는 값의 0 나눗셈이나 음수 `sqrt` 를 생성 코드가 실행 시간에 검사할지는 열려 있다. 06 브라우저 실행 문서를 본다.
