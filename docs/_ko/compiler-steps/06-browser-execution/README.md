# 6. 브라우저 실행

> 공통 규칙은 [../README.md](../README.md)를 본다.

- 상태: 초안
- 이전 단계: Wasm 코드 생성
- 다음 단계: 없음(최종)

## 1. 하는 일

생성된 Wasm 모듈을 실행해 브라우저에 그림을 표시한다.

### 처리 방식

- Canvas 그리기 함수를 제공해 생성된 모듈을 인스턴스화하고 모듈이 내보낸 `draw()`를 호출한다. 그리기 함수는 수학 좌표를 Canvas 픽셀 좌표로 변환한다.
- 모듈 로드나 실행에 실패하면 Canvas 영역에 표시한다.

## 2. 입력

- 출처: Wasm 코드 생성
- 형식: 코드 생성 응답에서 디코딩한 Wasm 바이트와 Canvas 그리기 함수.

아래 JSON은 브라우저 내부 입출력의 설명용 예시다.

```json
{
  "module": {
    "export": "draw"
  },
  "imports": [
    "moveTo",
    "lineTo",
    "stroke",
    "fillCircle"
  ]
}
```

## 3. 출력

- 형식: HTML Canvas에 그려진 그림.
- 화면에 보여주는 방식: HTML Canvas.

### 출력 키

그림은 Canvas에 그려진다. 아래 키는 브라우저 실행 결과를 설명하는 메타데이터 예시에 쓰인다.

| 키 | 타입 | 내용 |
|---|---|---|
| `target` | 문자열 | 예시의 `canvas` 값은 HTML Canvas가 그리기 대상임을 뜻한다. |
| `status` | 문자열 | 예시의 `rendered` 값은 `draw()`가 성공적으로 끝났음을 뜻한다. |

```json
{
  "target": "canvas",
  "status": "rendered"
}
```

## 4. 에러

| 종류 | 조건 | 메시지 예시 | 위치 정보 |
|---|---|---|---|
| 실행 준비 | 코드 생성 응답에 Wasm 데이터가 없거나 base64를 디코딩할 수 없음. | `could not decode the Wasm payload` | 브라우저 응답 또는 디코더. |
| 실행 준비 | WebAssembly 또는 Canvas 2D 컨텍스트를 사용할 수 없음. | `Canvas 2D context is unavailable` | 브라우저 기능 또는 Canvas 요소. |
| 실행 준비 | 디코딩한 바이트가 WebAssembly 컴파일 또는 검증에 실패함. | `invalid Wasm module` | WebAssembly 컴파일 에러. |
| 실행 준비 | 모듈을 인스턴스화할 때 필요한 임포트가 없거나 호환되지 않음. | `could not link Canvas imports` | 브라우저가 제공하는 경우 해당 임포트 이름. |
| 실행 준비 | 인스턴스에 호출할 수 있는 `draw` 익스포트가 없음. | `missing Wasm export 'draw'` | 해당 익스포트 이름. |
| 실행 | `draw()` 실행 중 Wasm 명령에서 트랩이 발생함. | `Wasm execution trapped in draw()` | 확인할 수 있으면 Wasm 스택 프레임. |
| 실행 | Wasm이 그리기를 실행하는 중 호스트에서 가져온 그리기 함수가 예외를 던짐. | `Canvas drawing operation failed` | 확인할 수 있으면 호스트 그리기 함수. |
| 실행(조건부) | 실행 중 검사를 추가한 경우 루프 변수에 따라 값이 달라지는 0 분모나 음수 `sqrt` 인자 등을 발견함. | `division by zero during draw()` | 검사에서 소스 위치를 보존한 경우 해당 위치. |

실행 중 검사와 소스 위치 매핑은 미정이다. Wasm의 `f64` 나눗셈에서 분모가 0이면 무한대나 NaN이 나올 수 있다. 이를 실행 에러로 보고하려면 명시적인 검사가 필요하다.

- 에러가 났을 때의 복구 방식: 컴파일 에러가 보고되면 Canvas 영역에 해당 진단을 표시한다. 실행을 시작한 뒤 실패하면 그리기를 멈추고 같은 영역에 실행 진단을 표시한다.
- 에러가 있을 때의 출력 형태: 렌더링 성공 결과 없이 Canvas 영역에 해당 진단을 표시한다.

## 5. API

- 엔드포인트: 브라우저에서 코드 생성 응답을 받아 실행한다.
- 요청 본문: 브라우저가 디코딩한 Wasm 바이트와 Canvas 그리기 함수를 사용한다.
- 응답 본문: Canvas 출력 또는 실행 진단.

## 6. 예시와 테스트 케이스

[cases/](cases/)의 파일은 빈 상태로 두었다. 아래 표에는 해당 폴더에 작성할 예시를 적었다.

| 케이스 | 종류 | 설명 |
|---|---|---|
| [`cases/_example/`](cases/_example/) | 정상 | Canvas에 선을 그리는 모듈을 실행한다. |

## 7. 미정 / 메모

- 브라우저 실행 오류의 진단 형식과 테스트의 검증 기준은 미정이다.
