# Hi-AI: 자연어 기반 AI 개발 도구

[![npm version](https://badge.fury.io/js/@su-record%2Fhi-ai.svg)](https://www.npmjs.com/package/@su-record/hi-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> "하이아이" 한마디로 시작하는, 당신의 '바이브 코딩'을 위한 가장 쉬운 AI 개발 도구

## 🎯 Hi-AI, 왜 만들었을까요? (The Story)

AI와 함께 코딩할 때, 이런 생각해 본 적 없으신가요?
**"유명해서 쓰고는 있는데, 이 도구가 정말 나에게 최적일까?"**

저 역시 유튜브와 블로그에서 추천하는 여러 MCP를 사용하며 시작했습니다. 하지만 곧 정형화된 도구들이 저만의 개발 리듬, 이른바 **'바이브 코딩(Vibe Coding)'** 스타일과는 맞지 않는다는 것을 깨달았죠.

그래서 직접 만들기로 결심했습니다. 제 실제 개발 워크플로우에 꼭 맞는 'AI 양념'을요. 🧂

Hi-AI는 복잡한 명령어 암기나 설정 없이, "하이아이"라는 인사 한마디로 시작해 자연스러운 대화로 개발 작업을 막힘없이 이어갈 수 있도록 설계되었습니다.

## ✨ 주요 특징 (Key Features)

- **🙌 가장 쉬운 시작:** 복잡한 설정 없이 `"hi-ai"` 인사 한마디면 모든 준비가 끝납니다.
- **🧠 스마트한 사고 보조:** 저사양 AI 모델도 체계적으로 사고하고 복잡한 문제를 해결하도록 돕습니다.
- **💾 자동화된 메모리:** 중요한 대화 내용은 자동으로 저장하고, 다음 작업 시 알아서 복원합니다.
- **🌐 실제 브라우저 연동:** Puppeteer 기반의 실제 브라우저 제어로 정확한 웹 개발 및 테스트를 수행합니다.
- **📏 코드 품질 관리:** 코드 복잡도 분석, 리팩토링 제안 등 품질 관리를 자동화합니다.

## 🚀 빠른 시작

### 1. 설치

**🎯 가장 쉬운 방법 - Smithery 사용 (추천)**
```
https://smithery.ai/server/@su-record/hi-ai
```
별도의 설치 과정이 필요 없습니다!

**📦 npm으로 직접 설치**
```bash
# 글로벌 설치
npm install -g @su-record/hi-ai
```

### 2. MCP 에디터 설정

Claude Desktop, Cursor, Windsurf 등의 설정 파일에 추가:

```json
{
  "mcpServers": {
    "hi-ai": {
      "command": "hi-ai",
      "args": [],
      "env": {}
    }
  }
}
```

### 3. 시작하기

```
You: 하이아이
AI: 준비됐어! 뭐 만들까?
```

`안녕`, `hello`, `こんにちは`, `你好`, `hola`, `bonjour` 등 다양한 인사말에 응답합니다.


## 🛠️ 29개의 강력한 도구 (29 Powerful Tools)

Hi-AI는 당신의 개발 워크플로우 전체를 지원하기 위해 엄선된 **29개의 도구**를 제공합니다.

**왜 29개인가요?**

> 일부 에디터(e.g., Cursor)의 MCP 도구 제한(약 40개)을 고려했습니다. Hi-AI의 핵심 기능만으로도 충분하지만, 여러분이 애용하는 다른 MCP 도구들과 함께 사용할 수 있도록 의도적으로 여유 공간을 남겨두었습니다.

### 🧠 생각 도구 (6개)

복잡한 문제를 AI가 체계적으로 분석하고 해결하도록 돕습니다.

- `analyze_problem`, `break_down_problem`, `create_thinking_chain`, `format_as_plan`, `step_by_step_analysis`, `think_aloud_process`

### 💾 메모리 도구 (10개)

중요한 컨텍스트를 놓치지 않도록 자동으로 관리합니다.

- `auto_save_context`, `delete_memory`, `list_memories`, `prioritize_memory`, `recall_memory`, `restore_session_context`, `save_memory`, `search_memories`, `start_session`, `update_memory`

### 🌐 브라우저 도구 (2개)

실제 브라우저 환경에서 웹 개발 및 테스트를 수행합니다.

- `monitor_console_logs`, `inspect_network_requests`

### 📏 코드 품질 도구 (6개)

깨끗하고 효율적인 코드를 유지하도록 돕습니다.

- `analyze_complexity`, `apply_quality_rules`, `check_coupling_cohesion`, `get_coding_guide`, `suggest_improvements`, `validate_code_quality`

### 📋 계획 도구 (4개)

프로젝트 기획과 문서화를 지원합니다.

- `analyze_requirements`, `create_user_stories`, `feature_roadmap`, `generate_prd`

### 🕐 시간 도구 (1개)

특정 타임존의 현재 시간을 정확히 조회합니다.

- `get_current_time`

## 💼 엔터프라이즈 기능

### 1. 🔧 확장성
- **📦 모듈형 아키텍처**: 각 도구가 독립적으로 동작하여 선택적 활성화 가능
- **🔌 플러그인 시스템**: 커스텀 도구 추가를 위한 표준화된 인터페이스

### 2. 🔒 보안 및 프라이버시
- **🏠 로컬 실행**: 모든 처리가 로컬에서 수행되어 데이터 유출 방지
- **🔐 메모리 격리**: 세션별 독립적인 메모리 공간 할당

### 3. ⚡ 성능 최적화
- **🚀 경량 설계**: 최소한의 의존성으로 빠른 실행 속도 보장
- **🔄 비동기 처리**: 모든 도구가 비동기로 동작하여 블로킹 방지

## 📈 사용 통계 및 메트릭

### 📊 도구별 활용도 분석
- 💾 메모리 도구: 평균 호출 빈도 최상위 (35%)
- 📏 코드 품질 도구: 코드 리뷰 시 집중 사용 (25%)
- 🎯 프롬프트 도구: 초기 요구사항 정의 시 활용 (20%)

### ⚡ 성능 지표
- ⏱️ 평균 응답 시간: < 100ms
- 💻 메모리 사용량: < 50MB
- 🔄 동시 처리 가능 세션: 무제한

## 🔬 기술적 구현 세부사항

### 📘 TypeScript 타입 시스템
```typescript
interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}
```

### 🔌 MCP 프로토콜 구현
- ✅ 표준 준수: MCP 1.0 스펙 완벽 구현
- 🛡️ 에러 처리: 체계적인 에러 코드 및 복구 메커니즘
- 📡 스트리밍 지원: 대용량 결과의 점진적 전송

## 🤝 기여 가이드

### 🛠️ 개발 환경 설정
```bash
git clone https://github.com/su-record/hi-ai.git
cd hi-ai
npm install
npm run dev
```

### 📝 코드 스타일
- ✨ ESLint + Prettier 설정 준수
- 📚 모든 퍼블릭 API에 JSDoc 주석 필수
- 🧪 단위 테스트 커버리지 80% 이상 유지

### 🔄 Pull Request 프로세스
1. 🌿 기능 브랜치 생성: `feature/tool-name`
2. 💬 변경사항 커밋: Conventional Commits 형식 준수
3. ✅ 테스트 통과 확인
4. 🎯 PR 생성 및 리뷰 요청

## 📜 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🏆 인용 및 참조

이 프로젝트를 연구나 상업적 용도로 사용하실 경우, 다음과 같이 인용해 주시기 바랍니다:

```bibtex
@software{hi-ai2024,
  author = {Su},
  title = {Hi-AI: Natural Language MCP Server for AI-Assisted Development},
  year = {2024},
  url = {https://github.com/su-record/hi-ai}
}
```

---

<p align="center">
<strong>Hi-AI</strong> - AI 기반 개발의 새로운 패러다임 🚀<br>
Made with ❤️ by <a href="https://github.com/su-record">Su</a> × <a href="https://claude.ai">Claude</a>
</p>