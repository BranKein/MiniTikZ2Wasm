# web-fe

([English](README.md)) 백엔드가 이 프런트엔드를 제공하므로 별도 정적 서버가 필요 없다.

저장소 루트에서 백엔드를 시작한 뒤 http://localhost:8000 을 연다.
파일을 수정하고 브라우저를 새로고침하면 변경 사항을 볼 수 있다.

테스트 (Node 18 이상, 설치 없음): `node --test web-fe/tests/canvas.test.mjs`. 손으로 조립한 Wasm 모듈로 Canvas 호스트(`js/canvas.js`: 픽셀 변환, 도 단위 `sin`/`cos`, 뷰 자동 맞춤)를 검사한다.
