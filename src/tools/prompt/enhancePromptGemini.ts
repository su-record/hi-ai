// Enhance prompts using Gemini API prompting strategies

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const enhancePromptGeminiDefinition: ToolDefinition = {
  name: 'enhance_prompt_gemini',
  description: '프롬프트 개선|제미나이 전략|품질 향상|prompt enhancement|gemini strategies|quality improvement - Enhance prompts using Gemini API prompting strategies (Few-Shot, Output Format, Context)',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The original prompt to enhance'
      },
      agent_role: {
        type: 'string',
        description: 'The role of the agent that will receive this prompt (e.g., "Specification Agent", "Planning Agent")'
      },
      strategies: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['few-shot', 'output-format', 'context-placement', 'decomposition', 'parameters']
        },
        description: 'Specific Gemini strategies to apply. If not provided, all strategies will be applied.'
      }
    },
    required: ['prompt']
  },
  annotations: {
    title: 'Enhance Prompt (Gemini Strategies)',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface PromptEnhancement {
  strategy: string;
  description: string;
  applied: string;
  improvement: string;
}

export async function enhancePromptGemini(args: {
  prompt: string;
  agent_role?: string;
  strategies?: string[];
}): Promise<ToolResult> {
  const { prompt, agent_role, strategies } = args;

  const allStrategies = ['few-shot', 'output-format', 'context-placement', 'decomposition', 'parameters'];
  const strategiesToApply = strategies && strategies.length > 0 ? strategies : allStrategies;

  const enhancements: PromptEnhancement[] = [];

  // 1. Few-Shot Examples
  if (strategiesToApply.includes('few-shot')) {
    enhancements.push({
      strategy: 'Few-Shot 예시 추가',
      description: '2-3개의 고품질 예시를 추가하여 모델이 패턴을 학습하도록 유도',
      applied: addFewShotExamples(prompt, agent_role),
      improvement: '형식, 표현, 범위를 명확히 하여 일관성 향상'
    });
  }

  // 2. Output Format Specification
  if (strategiesToApply.includes('output-format')) {
    enhancements.push({
      strategy: '출력 형식 명시화',
      description: 'XML 태그나 마크다운 헤더로 구조화된 형식 지정',
      applied: specifyOutputFormat(prompt, agent_role),
      improvement: '원하는 응답 구조를 명확히 하여 파싱 용이성 향상'
    });
  }

  // 3. Context Placement
  if (strategiesToApply.includes('context-placement')) {
    enhancements.push({
      strategy: '컨텍스트 배치 최적화',
      description: '긴 컨텍스트를 특정 요청 전에 배치 (Gemini 3 최적화)',
      applied: optimizeContextPlacement(prompt),
      improvement: '모델이 컨텍스트를 더 효과적으로 활용'
    });
  }

  // 4. Prompt Decomposition
  if (strategiesToApply.includes('decomposition')) {
    enhancements.push({
      strategy: '프롬프트 분해',
      description: '복잡한 작업을 여러 단계로 분해하여 체인화',
      applied: decomposePrompt(prompt, agent_role),
      improvement: '각 단계의 출력 품질 향상, 디버깅 용이'
    });
  }

  // 5. Parameter Tuning Suggestions
  if (strategiesToApply.includes('parameters')) {
    enhancements.push({
      strategy: '매개변수 튜닝 제안',
      description: 'Temperature, Top-K, Top-P, Max Tokens 최적 값 제안',
      applied: suggestParameters(prompt, agent_role),
      improvement: '작업 유형에 맞는 모델 동작 최적화'
    });
  }

  const result = {
    original_prompt: prompt,
    agent_role: agent_role || 'Generic Agent',
    strategies_applied: strategiesToApply,
    enhancements,
    enhanced_prompt: combineEnhancements(prompt, enhancements),
    summary: generateSummary(enhancements)
  };

  const output = formatOutput(result);

  return {
    content: [{ type: 'text', text: output }]
  };
}

// Helper methods
function addFewShotExamples(prompt: string, agent_role?: string): string {
  const examples = {
    'Specification Agent': `
**예시 1: 푸시 알림 설정**
입력: "댓글, 좋아요, 팔로우 알림을 켜고 끌 수 있게 해주세요"
출력:
- 알림 유형: 6개 (댓글, 좋아요, 팔로우, 공지, 이벤트, 마케팅)
- 설정 방식: ON/OFF 토글
- 디자인 참고: iOS Settings > Notifications
- 기술 스택: FCM (기존 사용 중)

**예시 2: 사용자 프로필 편집**
입력: "프로필 사진이랑 자기소개를 바꿀 수 있게 해주세요"
출력:
- 편집 항목: 프로필 사진, 자기소개, 표시 이름
- 검증: 이미지 크기 < 5MB, 자기소개 < 500자
- UI 패턴: 인라인 편집 (모달 아님)
- 저장 방식: 자동 저장 (debounce 500ms)`,

    'Planning Agent': `
**예시 1: API 엔드포인트 추가**
입력: "사용자 팔로우/언팔로우 기능"
출력:
- Phase 1: Backend (8시간)
  - DB 스키마 (follows 테이블)
  - API 엔드포인트 (POST /follows, DELETE /follows/:id)
  - 비즈니스 로직 (중복 방지, 자기 팔로우 금지)
- Phase 2: Frontend (6시간)
  - 팔로우 버튼 컴포넌트
  - 팔로워/팔로잉 목록
- 비용 영향: +0원 (기존 인프라 활용)

**예시 2: 실시간 알림**
입력: "댓글 달리면 실시간으로 알림"
출력:
- Phase 1: WebSocket 서버 구축 (12시간)
- Phase 2: 클라이언트 구독 로직 (8시간)
- Phase 3: 알림 UI (6시간)
- 비용 영향: +$20/월 (Redis Pub/Sub)`
  };

  return examples[agent_role as keyof typeof examples] || `
**Few-Shot 예시를 작업 유형에 맞게 추가**:
- 예시 1: [구체적인 입력] → [명확한 출력]
- 예시 2: [다른 형태의 입력] → [일관된 형식의 출력]
- 예시 3: [엣지 케이스] → [처리 방법]

**지침**:
- 2-3개 예시 (과적합 방지)
- 다양한 시나리오 포함
- 일관된 출력 형식 유지`;
}

function specifyOutputFormat(prompt: string, agent_role?: string): string {
  const formats = {
    'Specification Agent': `
**출력 형식 (마크다운 + YAML frontmatter)**:

\`\`\`markdown
---
title: [기능 이름]
priority: [HIGH/MEDIUM/LOW]
created: [날짜]
---

# SPEC: [기능 이름]

## REQ-001: [요구사항 제목]
**WHEN** [조건]
**THEN** [결과]

### Acceptance Criteria
- [ ] [기준 1]
- [ ] [기준 2]
\`\`\`

**응답 접두사**: "# SPEC: "로 시작하여 모델이 올바른 형식으로 완성하도록 유도`,

    'Planning Agent': `
**출력 형식 (구조화된 마크다운)**:

\`\`\`markdown
# PLAN: [기능 이름]

## Architecture
- Backend: [기술 스택]
- Frontend: [기술 스택]
- Database: [스키마 변경사항]

## Timeline
| Phase | Tasks | Duration |
|-------|-------|----------|
| 1     | ...   | 8h       |

## Cost Analysis
- Infrastructure: +$X/월
- Third-party: +$Y/월
- Total: +$Z/월
\`\`\`

**응답 접두사**: "# PLAN: "로 시작`
  };

  return formats[agent_role as keyof typeof formats] || `
**출력 형식 명시**:
- 마크다운 헤더로 섹션 구분 (##, ###)
- 테이블, 불릿 포인트, 체크박스 활용
- XML 태그로 의미 구성요소 레이블링 (선택)
  예: <analysis>...</analysis>, <recommendation>...</recommendation>
- 응답 접두사로 완성 유도
  예: "분석 결과: "로 시작하면 모델이 분석 내용으로 완성`;
}

function optimizeContextPlacement(prompt: string): string {
  return `
**컨텍스트 배치 최적화 (Gemini 3 권장)**:

1. **긴 컨텍스트를 앞에 배치**:
\`\`\`
[기술 스택 정보 (CLAUDE.md 내용)]
[기존 코드베이스 구조]
[관련 SPEC/PLAN 문서]

--- 이후 구체적 요청 ---

[사용자의 구체적 질문이나 작업]
\`\`\`

2. **컨텍스트 구조화**:
- 카테고리별로 그룹화 (기술 스택, 아키텍처, 비즈니스 로직)
- 중요한 제약 조건은 반복해서 강조
- 참조 가능하도록 명확한 레이블링

3. **명시적 지시사항 배치**:
- 컨텍스트 다음에 구체적 작업 지시
- 단계별 지침 (1, 2, 3...)
- 출력 형식 예시`;
}

function decomposePrompt(prompt: string, agent_role?: string): string {
  const isComplex = prompt.length > 200 || prompt.includes('및') || prompt.includes('그리고') || prompt.includes('and');

  if (!isComplex) {
    return '**프롬프트 분해 불필요**: 단순한 작업이므로 단일 프롬프트로 충분합니다.';
  }

  return `
**프롬프트 분해 (순차적 체인)**:

**Step 1: 정보 수집**
\`\`\`
프롬프트: "${prompt.slice(0, 100)}..."에 대한 필수 정보를 식별하세요.
출력: 필요한 기술 스택, 제약 조건, 선행 작업 목록
\`\`\`

**Step 2: 분석 및 계획**
\`\`\`
프롬프트: Step 1의 정보를 바탕으로 구현 계획을 작성하세요.
입력: [Step 1의 출력]
출력: Phase별 작업, 타임라인, 리스크
\`\`\`

**Step 3: 세부 작업 생성**
\`\`\`
프롬프트: Step 2의 계획을 실행 가능한 작업으로 분해하세요.
입력: [Step 2의 출력]
출력: Task 목록 (의존성 포함)
\`\`\`

**장점**:
- 각 단계의 출력 품질 향상
- 중간 검증 가능
- 에러 발생 시 특정 단계만 재실행`;
}

function suggestParameters(prompt: string, agent_role?: string): string {
  const isCreative = prompt.includes('디자인') || prompt.includes('아이디어') || prompt.includes('제안');
  const isDeterministic = prompt.includes('분석') || prompt.includes('계산') || prompt.includes('검증');

  let temperature = 1.0; // Gemini 3 default
  let topP = 0.95;
  let topK = 40;

  if (isCreative) {
    temperature = 1.0;
    topP = 0.95;
  } else if (isDeterministic) {
    temperature = 0.2;
    topP = 0.8;
    topK = 20;
  }

  return `
**권장 매개변수** (작업 특성 기반):

- **Temperature**: ${temperature}
  ${temperature > 0.7 ? '창의적 작업에 적합 (다양한 옵션 탐색)' : '결정적 작업에 적합 (일관된 출력)'}

- **Top-P**: ${topP}
  누적 확률 ${topP * 100}%까지의 토큰만 선택

- **Top-K**: ${topK}
  상위 ${topK}개 토큰만 고려

- **Max Output Tokens**: ${agent_role === 'Specification Agent' ? '4000 (상세 문서)' : '2000 (일반)'}

- **Stop Sequences**: ["---END---", "\`\`\`"] (선택)

**주의**:
- Gemini 3는 temperature 기본값 1.0 유지 권장
- 예상치 못한 동작 방지를 위해 기본값에서 크게 벗어나지 않기`;
}

function combineEnhancements(prompt: string, enhancements: PromptEnhancement[]): string {
  let enhanced = `# Enhanced Prompt\n\n`;
  enhanced += `## Original Request\n${prompt}\n\n`;
  enhanced += `---\n\n`;

  enhancements.forEach((e, i) => {
    enhanced += `## Enhancement ${i + 1}: ${e.strategy}\n\n`;
    enhanced += `${e.applied}\n\n`;
  });

  return enhanced;
}

function generateSummary(enhancements: PromptEnhancement[]): string {
  return `${enhancements.length}개의 Gemini 프롬프팅 전략을 적용하여 프롬프트 품질을 향상시켰습니다:
${enhancements.map(e => `- ${e.strategy}: ${e.improvement}`).join('\n')}`;
}

function formatOutput(result: any): string {
  let output = `# Gemini 프롬프트 개선\n\n`;
  output += `**원본 프롬프트**: ${result.original_prompt}\n`;
  output += `**대상 에이전트**: ${result.agent_role}\n`;
  output += `**적용 전략**: ${result.strategies_applied.join(', ')}\n\n`;
  output += `---\n\n`;

  result.enhancements.forEach((e: PromptEnhancement, i: number) => {
    output += `## ${i + 1}. ${e.strategy}\n\n`;
    output += `**설명**: ${e.description}\n\n`;
    output += `**적용 내용**:\n${e.applied}\n\n`;
    output += `**개선 효과**: ${e.improvement}\n\n`;
    output += `---\n\n`;
  });

  output += `## 개선된 프롬프트\n\n`;
  output += '```markdown\n' + result.enhanced_prompt + '\n```\n\n';
  output += `## 요약\n\n${result.summary}`;

  return output;
}
