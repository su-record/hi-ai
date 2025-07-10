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