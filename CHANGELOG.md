# 변경 이력 (Changelog)

## [1.3.0] - 2025-01-16

### ✨ 새로운 기능
- **Python 지원 추가**
  - Python 코드 시맨틱 분석 (함수, 클래스, 변수 검색)
  - Cyclomatic 복잡도 분석
  - Python AST 파서 via subprocess
  - TypeScript/JavaScript + Python 하이브리드 프로젝트 지원

- **스마트 컨텍스트 압축**
  - 긴 대화에서 50-70% 토큰 절감
  - 우선순위 기반 스코어링 (코드 > 답변 > 질문 > 메타데이터)
  - 긴급도 인식 압축 레벨 (2K-6K 토큰)
  - 자동 저우선순위 섹션 제거

- **종합 테스트 스위트**
  - 71개 테스트 (100% 통과)
  - Critical path 검증
  - MemoryManager, ContextCompressor, PythonParser, ProjectCache 단위 테스트

- **공통 타입 정의**
  - `src/types/tool.ts` 중앙화된 타입 시스템
  - 170줄 중복 인터페이스 제거
  - 34개 도구 전체 타입 일관성 개선

### ⚡ 성능 개선
- **25배 빠른 코드 분석**: LRU 프로젝트 캐시
  - 5 프로젝트 캐시, 5분 TTL
  - 대형 프로젝트 분석: 8초 → 0.3초
  - 자동 캐시 무효화 및 제거

- **80% 토큰 절감**: 압축된 도구 응답 및 설명
  - 도구 설명: 8KB → 2KB (70% 감소)
  - 도구 응답: 200-500 토큰 → 30-100 토큰 (80% 감소)
  - 브라우저 도구: 컴팩트 요약 형식

### 🔄 변경사항
- **SQLite 마이그레이션**: JSON 파일 저장소를 SQLite로 교체
  - `memories.json` → `memories.db` 자동 마이그레이션
  - 백업 생성 (`memories.json.backup`)
  - 카테고리, 타임스탬프, 우선순위 인덱싱
  - 동시성 제어 및 트랜잭션 지원 개선

- **MemoryManager 기능 강화**
  - `getByPriority(priority)`: 우선순위별 필터링
  - `updatePriority(key, priority)`: 우선순위 업데이트
  - `search(query)`: 키/값 전문 검색

### 🐛 수정사항
- ProjectCache 경로 정규화 (trailing slash 처리)
- 컨텍스트 압축 엣지 케이스 (빈 문자열, 짧은 텍스트)
- Python 파서 임시 파일 정리 (에러 시)
- 모든 도구 응답 형식 일관성

### 🏗️ 인프라
- vitest 테스팅 프레임워크 추가
- 테스트 스크립트: `test`, `test:watch`, `test:ui`, `test:coverage`
- `tests/unit/` 디렉토리 구조 생성
- `vitest.config.ts` 설정 추가

### 📦 의존성
- `vitest@^4.0.9` (dev)
- `@vitest/ui@^4.0.9` (dev)
- `better-sqlite3@^12.4.1`
- `@types/better-sqlite3@^7.6.13`
- `glob@^11.0.3`
- `@types/glob@^8.1.0`

---

## [1.1.0] - 2025-08-13
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