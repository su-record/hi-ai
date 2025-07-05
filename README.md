# Hi-AI 🤖 - AI 어렵지 않아!

[![npm version](https://badge.fury.io/js/@su-record%2Fhi-ai.svg)](https://www.npmjs.com/package/@su-record/hi-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> "하이아이" 한마디로 시작하는 가장 쉬운 AI 개발 도구

## 🎯 Hi-AI가 뭐야?

AI와 개발이 어렵다고? **Hi-AI**면 충분해!

```
User: hi-ai
AI: 안녕! 뭐 도와줄까? 이전에 하던 작업도 기억하고 있어!
```

## ✨ 왜 Hi-AI야?

- **🙌 인사 한마디로 시작** - "hi-ai"만 하면 알아서 준비 완료
- **🧠 AI도 똑똑하게** - 저성능 AI도 체계적으로 사고하도록 도와줌
- **💾 알아서 기억** - 중요한 건 자동으로 저장하고 복원
- **🌐 진짜 브라우저** - 가짜 아님, Puppeteer로 진짜 웹 개발
- **📏 깔끔한 코드** - 코드 품질은 자동으로 체크

## 📦 설치

```bash
# npm으로
npm install -g @su-record/hi-ai

# Smithery로 바로 사용
# https://smithery.ai/server/@su-record/hi-ai
```

## 🚀 시작하기

### 1. 설치 방법

**🎯 가장 쉬운 방법 - Smithery 사용**
- 바로 사용: https://smithery.ai/server/@su-record/hi-ai
- 설치 필요 없음!

**📦 npm으로 설치**
```bash
npm install -g @su-record/hi-ai
```

### 2. MCP 설정

Claude Desktop, Cursor, Windsurf 등에서:

```json
{
  "mcpServers": {
    "hi-ai": {
      "command": "hi-ai"
    }
  }
}
```

### 3. 인사하기

```
You: hi-ai (또는 하이아이)
AI: 준비됐어! 뭐 만들까?
```

다른 인사말도 OK: 안녕, hello, こんにちは, 你好, hola, bonjour...

## 🛠️ 뭘 할 수 있어?

### 🧠 생각 도구 (6개)
복잡한 문제? AI가 차근차근 생각하게 도와줘
- 문제 분석, 단계별 분해, 사고 체인, 계획 수립...

### 💾 메모리 도구 (10개)
중요한 건 까먹지 않아
- 자동 저장, 세션 복원, 우선순위 관리...

### 🌐 브라우저 도구 (2개)
진짜 브라우저로 개발
- 콘솔 로그 모니터링, 네트워크 요청 추적

### 📏 코드 품질 도구 (6개)
깔끔한 코드 유지
- 품질 검증, 복잡도 분석, 개선 제안...

### 📋 계획 도구 (4개)
프로젝트 계획도 쉽게
- PRD 생성, 사용자 스토리, 로드맵...

### 🕐 시간 도구 (1개)
시간대 변환, 현재 시간 조회

**총 29개 도구로 모든 개발 작업을 쉽게!**

## 💡 이런 식으로 써

```
You: 하이아이
AI: 어서와! 지난번 React 프로젝트 이어서 할까?

You: 이 코드 복잡도 좀 봐줘
AI: analyze_complexity로 분석해볼게... [자동으로 도구 사용]

You: 오늘 한 거 저장해둬
AI: auto_save_context로 저장 완료! 다음에 "hi-ai"하면 자동으로 불러올게
```

## 🎯 Hi-AI 철학

**"AI 어렵지 않아!"**

- 명령어 외울 필요 없어
- 자연스럽게 대화하면 돼
- AI가 알아서 도구 선택해
- 복잡한 설정 필요 없어

## 🏗️ 기술적 특징

- **완전 모듈화**: 29개 도구가 각각 독립적
- **TypeScript**: 타입 안전성 보장
- **의존성 최소화**: 필수 패키지만 사용
- **MCP 표준**: 모든 MCP 지원 환경에서 작동

## 🤝 같이 만들어요

버그 발견? 아이디어 있어? 
[GitHub Issues](https://github.com/su-record/hi-ai/issues)로 알려줘!

## 📄 라이선스

MIT - 맘대로 써!

---

<p align="center">
<strong>Hi-AI</strong> - AI 개발, 이제 정말 쉬워졌다 🚀<br>
Made with ❤️ by <a href="https://github.com/su-record">Su</a> × <a href="https://claude.ai">Claude</a>
</p>