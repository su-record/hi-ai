# Hi-AI 🤖 - AI 어렵지 않아!

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
npm install -g @su-record/hi-ai
```

### 2. MCP 에디터 설정

Claude Desktop, Cursor, Windsurf 등의 설정 파일에 추가:

```json
{
  "mcpServers": {
    "hi-ai": {
      "command": "hi-ai"
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

## 💡 추천 조합: Hi-AI + Context-7

Hi-AI는 **Context-7 MCP**와 함께 사용할 때 더욱 강력한 시너지를 발휘합니다.

- **Hi-AI:** 전체적인 개발 워크플로우와 메모리 관리
- **Context-7:** 최신 버전별 문서와 코드 예제를 프롬프트에 직접 가져와 오래된 정보 제거

이 조합으로 개발의 흐름은 유지하면서, 필요한 정보는 실시간으로 얻는 개발 환경을 경험해 보세요.

## 💡 이런 식으로 써 (Usage Example)

```
You: 하이아이
AI: 어서와! 지난번 React 프로젝트 이어서 할까? (restore_session_context로 자동 복원)

You: 이 코드 복잡도 좀 봐줘
AI: 알았어, analyze_complexity 도구를 사용해서 분석해볼게. [자동으로 도구 실행]

You: 오늘 작업한 내용 저장해둬
AI: 응, auto_save_context로 저장 완료! 다음에 "hi-ai"라고 부르면 자동으로 불러올게.
```

## 🎯 Hi-AI 철학 (Philosophy)

**"AI 개발, 어렵지 않아야 한다."**

이것이 Hi-AI의 핵심입니다.

- **No 암기:** 복잡한 명령어를 외울 필요가 없습니다.
- **Be Natural:** 평소처럼 자연스럽게 대화하세요.
- **AI Autonomy:** AI가 상황에 맞는 도구를 스스로 선택하고 사용합니다.
- **Zero Config:** 설치 후 복잡한 설정 과정이 필요 없습니다.

## 🏗️ 기술적 특징 (Technical Features)

- **완전 모듈화**: 29개 도구가 각각 독립적인 모듈로 구성되어 유지보수와 확장이 용이합니다.
- **TypeScript**: 타입 안전성을 보장하여 코드의 안정성을 높였습니다.
- **의존성 최소화**: 가볍고 빠른 실행을 위해 필수 패키지만 사용합니다.
- **MCP 표준**: 모든 MCP 지원 환경(Claude Desktop, Cursor, Windsurf 등)에서 원활하게 작동합니다.

## 🤝 같이 만들어요 (Contribute)

버그를 발견했거나, 더 좋은 아이디어가 있으신가요? 언제든지 [GitHub Issues](https://github.com/su-record/hi-ai/issues)를 통해 의견을 남겨주세요!<br />
여러분의 참여를 환영합니다.

## 📄 라이선스 (License)

이 프로젝트는 MIT 라이선스를 따릅니다. 마음껏 사용하고, 수정하고, 배포하세요.

---

<p align="center">
<strong>Hi-AI</strong> - AI 개발, 이제 정말 쉬워졌다 🚀<br>
Made with ❤️ by <a href="https://github.com/su-record">Su</a> × <a href="https://claude.ai">Claude</a>
</p>
