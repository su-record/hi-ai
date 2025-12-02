// Apply 9-step reasoning framework to complex problems

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const applyReasoningFrameworkDefinition: ToolDefinition = {
  name: 'apply_reasoning_framework',
  description: '추론 프레임워크|체계적 분석|논리적 사고|reasoning framework|systematic analysis|logical thinking - Apply 9-step reasoning framework to analyze complex problems systematically',
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description: 'The problem or task to analyze using the reasoning framework'
      },
      context: {
        type: 'string',
        description: 'Additional context about the problem (project constraints, tech stack, etc.)'
      },
      focus_steps: {
        type: 'array',
        items: { type: 'number' },
        description: 'Specific framework steps to focus on (1-9). If not provided, all steps will be applied.'
      }
    },
    required: ['problem']
  },
  annotations: {
    title: 'Apply Reasoning Framework',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface ReasoningStep {
  step: number;
  title: string;
  description: string;
  questions: string[];
  output: string;
}

export async function applyReasoningFramework(args: {
  problem: string;
  context?: string;
  focus_steps?: number[];
}): Promise<ToolResult> {
  const { problem, context, focus_steps } = args;

  const allSteps: ReasoningStep[] = [
    {
      step: 1,
      title: '논리적 종속성 및 제약 조건',
      description: '정책, 작업 순서, 전제 조건, 사용자 제약을 중요도 순으로 분석',
      questions: [
        '어떤 정책이나 필수 규칙이 적용되는가?',
        '작업 순서를 재정렬해야 하는가? (선행 작업 확인)',
        '필요한 전제 조건이나 정보는?',
        '명시적 사용자 제약 조건이 있는가?'
      ],
      output: analyzeConstraints(problem, context)
    },
    {
      step: 2,
      title: '위험 평가',
      description: '행동의 결과와 향후 문제 가능성 평가',
      questions: [
        '이 행동이 미래에 문제를 일으킬 수 있는가?',
        '탐색 작업인가, 구현 작업인가? (위험 수준 결정)',
        '호환성, 보안, 성능 위험은?',
        '롤백이 가능한가?'
      ],
      output: assessRisks(problem, context)
    },
    {
      step: 3,
      title: '귀납적 추론 및 가설 탐색',
      description: '문제의 근본 원인에 대한 가설 생성 및 우선순위화',
      questions: [
        '즉각적 원인을 넘어선 근본 원인은?',
        '각 가설을 어떻게 검증할 것인가?',
        '가능성이 낮은 원인도 고려했는가?'
      ],
      output: generateHypotheses(problem, context)
    },
    {
      step: 4,
      title: '결과 평가 및 적응성',
      description: '관찰 결과에 따라 계획 조정',
      questions: [
        '이전 관찰이 계획 변경을 요구하는가?',
        '가설이 반증되었다면 새 가설을 생성했는가?',
        '막다른 길에 도달했다면 백트래킹이 필요한가?'
      ],
      output: evaluateAdaptability(problem, context)
    },
    {
      step: 5,
      title: '정보 가용성',
      description: '모든 정보 소스 식별 및 활용',
      questions: [
        '사용 가능한 도구는? (MCP, 파일 시스템, Git 등)',
        '참조해야 할 정책/규칙 문서는? (CLAUDE.md, constitution.md)',
        '이전 대화나 메모리에서 관련 정보를 찾았는가?',
        '사용자에게 물어야 할 정보는?'
      ],
      output: identifyInformationSources(problem, context)
    },
    {
      step: 6,
      title: '정밀성 및 근거',
      description: '주장에 대한 정확한 근거 제시',
      questions: [
        '정책 참조 시 정확히 인용했는가?',
        '코드 참조 시 파일명:라인을 명시했는가?',
        '숫자와 메트릭이 정확한가?'
      ],
      output: ensurePrecision(problem, context)
    },
    {
      step: 7,
      title: '완전성',
      description: '모든 요구사항, 옵션, 선호도 통합',
      questions: [
        '충돌하는 요구사항을 중요도 순으로 해결했는가?',
        '조기 결론을 내리지 않았는가? (여러 옵션 고려)',
        '모든 관련 정보 소스를 검토했는가?'
      ],
      output: ensureCompleteness(problem, context)
    },
    {
      step: 8,
      title: '끈기와 인내',
      description: '모든 추론을 소진할 때까지 포기하지 않기',
      questions: [
        '일시적 오류는 재시도했는가?',
        '명확한 한계(재시도 제한, 타임아웃)에 도달했는가?',
        '같은 실패를 반복하지 않고 전략을 변경했는가?'
      ],
      output: demonstratePersistence(problem, context)
    },
    {
      step: 9,
      title: '응답 억제',
      description: '추론 완료 후에만 행동',
      questions: [
        '위의 모든 추론이 완료되었는가?',
        '추론 과정을 문서화했는가?',
        '한 번에 하나의 주요 행동만 수행하는가?'
      ],
      output: planExecution(problem, context)
    }
  ];

  // Filter steps if focus_steps is provided
  const stepsToApply = focus_steps && focus_steps.length > 0
    ? allSteps.filter(s => focus_steps.includes(s.step))
    : allSteps;

  const result = {
    problem,
    context: context || 'No additional context provided',
    steps_applied: stepsToApply.length,
    framework_steps: stepsToApply,
    summary: generateSummary(problem, stepsToApply)
  };

  const output = formatOutput(result);

  return {
    content: [{ type: 'text', text: output }]
  };
}

// Helper methods
function analyzeConstraints(problem: string, context?: string): string {
  return `**제약 조건 분석**:
- 정책/규칙: ${context ? '프로젝트 컨텍스트 확인 필요' : 'CLAUDE.md, constitution.md 확인 필요'}
- 작업 순서: 선행 작업 식별 필요 (DB → Backend → Frontend 패턴 고려)
- 전제 조건: ${problem}을(를) 위한 필수 정보/도구 확인
- 사용자 제약: 명시적 요청사항 우선 적용`;
}

function assessRisks(problem: string, context?: string): string {
  const isExploration = problem.toLowerCase().includes('찾') ||
                        problem.toLowerCase().includes('분석') ||
                        problem.toLowerCase().includes('확인') ||
                        problem.toLowerCase().includes('find') ||
                        problem.toLowerCase().includes('analyze');

  return `**위험 평가**:
- 작업 유형: ${isExploration ? '탐색 작업 (낮은 위험)' : '구현 작업 (높은 위험)'}
- 롤백 가능성: ${isExploration ? '높음' : '확인 필요'}
- 호환성 위험: 기존 코드와의 충돌 가능성 검토
- 보안 위험: SQL Injection, XSS, 민감 정보 노출 검토
- 성능 위험: N+1 쿼리, 메모리 누수, 불필요한 리렌더 검토`;
}

function generateHypotheses(problem: string, context?: string): string {
  return `**가설 생성**:
1. **가설 1** (가능성: 높음)
   - 근거: ${problem}의 가장 직접적인 원인
   - 검증: [도구/파일]을 통해 확인
2. **가설 2** (가능성: 중간)
   - 근거: 간접적 요인 또는 환경 차이
   - 검증: 추가 정보 수집 필요
3. **가설 3** (가능성: 낮음)
   - 근거: 엣지 케이스 또는 드문 상황
   - 검증: 다른 가설 반증 시 검토

**우선순위**: 가능성 높은 순으로 검증하되, 낮은 가능성도 완전히 배제하지 않음`;
}

function evaluateAdaptability(problem: string, context?: string): string {
  return `**적응성 평가**:
- 관찰 결과 반영: 새로운 정보에 따라 계획 수정 필요 여부 확인
- 가설 업데이트: 반증된 가설 폐기, 새 가설 생성
- 백트래킹: 막다른 길 도달 시 이전 단계로 돌아가 다른 경로 탐색
- 계획 재평가: 전체 접근법이 유효한지 주기적으로 검토`;
}

function identifyInformationSources(problem: string, context?: string): string {
  return `**정보 소스**:
1. **도구**:
   - MCP 도구 (hi-ai 38개 도구)
   - 파일 시스템 (Read, Write, Edit, Glob, Grep)
   - Git, 패키지 관리자
2. **정책/규칙**:
   - CLAUDE.md (기술 스택, 아키텍처)
   - .vibe/constitution.md (프로젝트 규칙)
   - skills/ 폴더 (품질 기준, 코딩 표준)
3. **메모리**:
   - recall_memory (이전 세션 정보)
   - restore_session_context (컨텍스트 복원)
4. **사용자 확인**:
   - 비즈니스 로직 세부사항
   - 디자인 선호도
   - 우선순위 결정`;
}

function ensurePrecision(problem: string, context?: string): string {
  return `**정밀성 확보**:
- 정책 인용: "CLAUDE.md:12에 따르면..." 형식으로 명시
- 코드 참조: "users.py:45의 User 모델" 형식으로 파일명:라인 포함
- 숫자 정확성: 복잡도, 커버리지, 성능 지표를 정확한 수치로 표현
- 근거 제시: 모든 주장에 대해 출처와 근거 명확히`;
}

function ensureCompleteness(problem: string, context?: string): string {
  return `**완전성 확보**:
- 충돌 해결: 정책 → 작업 순서 → 전제 조건 → 사용자 선호도 순
- 옵션 탐색: 단일 해결책에 조기 고정하지 않고 여러 대안 검토
- 정보 검토: 모든 관련 정보 소스(#5) 철저히 검토
- 사용자 확인: 불확실한 부분은 가정하지 말고 확인`;
}

function demonstratePersistence(problem: string, context?: string): string {
  return `**끈기 전략**:
- 일시적 오류: 지수 백오프로 재시도 (예: 1초, 2초, 4초...)
- 한계 인식: 명확한 재시도 제한, 타임아웃 도달 시 중단
- 전략 변경: 같은 실패 반복 X → 다른 접근법 시도
- 철저한 분석: 시간이 걸리더라도 모든 추론 단계 완료`;
}

function planExecution(problem: string, context?: string): string {
  return `**실행 계획**:
1. **추론 문서화**: 복잡한 결정의 경우 추론 과정 간략히 설명
2. **단계별 실행**: 한 번에 하나의 주요 행동만 수행
3. **결과 확인**: 각 행동의 결과를 확인한 후 다음 단계로 진행
4. **롤백 대비**: 문제 발생 시 이전 상태로 복구 가능하도록 준비`;
}

function generateSummary(problem: string, steps: ReasoningStep[]): string {
  return `9단계 추론 프레임워크를 "${problem}"에 적용했습니다.
총 ${steps.length}개 단계를 체계적으로 분석하여 논리적 종속성, 위험, 가설, 정보 소스를 포괄적으로 검토했습니다.`;
}

function formatOutput(result: any): string {
  let output = `# 추론 프레임워크 분석\n\n`;
  output += `**문제**: ${result.problem}\n`;
  output += `**컨텍스트**: ${result.context}\n`;
  output += `**적용 단계**: ${result.steps_applied}/9\n\n`;
  output += `---\n\n`;

  for (const step of result.framework_steps) {
    output += `## ${step.step}. ${step.title}\n\n`;
    output += `${step.description}\n\n`;
    output += `**핵심 질문**:\n`;
    step.questions.forEach((q: string) => {
      output += `- ${q}\n`;
    });
    output += `\n${step.output}\n\n`;
    output += `---\n\n`;
  }

  output += `## 요약\n\n${result.summary}`;

  return output;
}
