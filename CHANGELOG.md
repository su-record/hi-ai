# 변경 이력 (Changelog)

## [Unreleased]
### ✨ 새로운 기능
- **시맨틱 코드 분석 도구 추가**
  - `find_symbol`: 프로젝트 전체에서 함수, 클래스, 변수 등 심볼 검색
  - `find_references`: 심볼의 모든 참조 위치 찾기
  - ts-morph 기반 정확한 AST 분석으로 단순 텍스트 매칭보다 정확
  - TypeScript, JavaScript, JSX, TSX 파일 지원

### 🐛 버그 수정
- **브라우저 도구 수정**
  - `browserUtils.ts` 추가: PC에 설치된 Chrome/Edge/Brave 자동 탐지
  - `monitorConsoleLogs`, `inspectNetworkRequests` 도구가 브라우저 실행 경로를 자동으로 찾도록 개선
  - 브라우저를 찾지 못할 경우 명확한 에러 메시지 및 해결 방법 제공
  - Windows/macOS/Linux 모든 플랫폼 지원

## [1.0.6] - 2025-07-10
### 🛠️ 성능 최적화
- ts-morph `Project`를 싱글턴으로 재사용하여 메모리·CPU 사용량 감소
- `allowJs: true`, `skipLibCheck: true` 적용 → JavaScript 코드 파싱 속도 개선
- 대용량 코드 분석 시 응답 지연 감소(체감 20~40%)

---

## [1.0.5] - 2025-07-10
### ✨ 주요 기능 추가
- **AST 기반 코드 분석 도입**
  - `analyze_complexity`: Cyclomatic / Cognitive / Halstead 복잡도를 AST로 정확하게 계산
  - `check_coupling_cohesion`: Import·Require·클래스·함수 구조를 AST로 분석하여 결합도·응집도 평가 향상
  - `break_down_problem`: 코드 입력 시 AST로 함수·클래스·변수를 자동 분해하여 하위 문제 생성
- **새로운 의존성**: `ts-morph`(v26) 추가

### 📝 문서 업데이트
- README: AST 기반 분석 기능 소개, 도구 수 31개로 업데이트
- smithery.json: 도구 수 문구(29→31) 및 버전 1.0.5 반영

### 🛠️ 기타 변경
- `package.json` 버전 1.0.5
- 테스트 스크립트 생성·삭제