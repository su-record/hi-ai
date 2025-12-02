// Prompt enhancement tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const enhancePromptDefinition: ToolDefinition = {
  name: 'enhance_prompt',
  description: '구체적으로|자세히|명확하게|더 구체적으로|be specific|more detail|clarify|elaborate|vague - Transform vague requests',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Original prompt to enhance' },
      context: { type: 'string', description: 'Additional context or project information' },
      enhancement_type: {
        type: 'string',
        enum: ['clarity', 'specificity', 'context', 'all'],
        description: 'Type of enhancement (default: all)'
      }
    },
    required: ['prompt']
  },
  annotations: {
    title: 'Enhance Prompt',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function enhancePrompt(args: { prompt: string; context?: string; enhancement_type?: string }): Promise<ToolResult> {
  const { prompt, context = '', enhancement_type = 'all' } = args;
  
  // Enhancement logic
  const enhancements: Record<string, string[]> = {
    clarity: [],
    specificity: [],
    context: [],
    structure: []
  };
  
  // Analyze original prompt
  const promptLength = prompt.length;
  const hasQuestion = prompt.includes('?');
  const hasSpecificTerms = /\b(구현|개발|수정|분석|디버그|리팩토링)\b/i.test(prompt);
  
  // Apply enhancements based on type
  if (enhancement_type === 'clarity' || enhancement_type === 'all') {
    if (promptLength < 20) {
      enhancements.clarity.push('더 구체적인 설명 추가');
    }
    if (!hasQuestion && !hasSpecificTerms) {
      enhancements.clarity.push('명확한 요청이나 질문 형태로 변환');
    }
  }
  
  if (enhancement_type === 'specificity' || enhancement_type === 'all') {
    if (!prompt.match(/\b(언어|프레임워크|라이브러리|버전)\b/)) {
      enhancements.specificity.push('기술 스택 명시');
    }
    if (!prompt.match(/\b(입력|출력|결과|형식)\b/)) {
      enhancements.specificity.push('예상 입출력 정의');
    }
  }
  
  if (enhancement_type === 'context' || enhancement_type === 'all') {
    if (!prompt.match(/\b(목적|이유|배경|상황)\b/)) {
      enhancements.context.push('작업 목적과 배경 추가');
    }
    if (context) {
      enhancements.context.push('제공된 컨텍스트 통합');
    }
  }
  
  // Generate enhanced prompt
  let enhancedPrompt = prompt;
  
  // Build enhanced version
  const components = [];
  
  // Add objective
  components.push(`**목표**: ${prompt}`);
  
  // Add context if provided
  if (context) {
    components.push(`**배경**: ${context}`);
  }
  
  // Add specific requirements based on analysis
  const requirements = [];
  if (enhancements.specificity.includes('기술 스택 명시')) {
    requirements.push('- 사용할 언어/프레임워크를 명시해주세요');
  }
  if (enhancements.specificity.includes('예상 입출력 정의')) {
    requirements.push('- 예상되는 입력과 출력 형식을 설명해주세요');
  }
  
  if (requirements.length > 0) {
    components.push(`**요구사항**:\n${requirements.join('\n')}`);
  }
  
  // Add quality considerations
  const quality = [
    '- 에러 처리 포함',
    '- 테스트 가능한 구조',
    '- 확장 가능한 설계'
  ];
  components.push(`**품질 기준**:\n${quality.join('\n')}`);
  
  enhancedPrompt = components.join('\n\n');
  
  const result = {
    action: 'enhance_prompt',
    original: prompt,
    enhanced: enhancedPrompt,
    enhancements,
    improvements: [
      enhancements.clarity.length > 0 ? `명확성 개선 (${enhancements.clarity.length}개)` : null,
      enhancements.specificity.length > 0 ? `구체성 추가 (${enhancements.specificity.length}개)` : null,
      enhancements.context.length > 0 ? `맥락 보강 (${enhancements.context.length}개)` : null
    ].filter(Boolean),
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Original: ${prompt}\n\nEnhanced:\n${enhancedPrompt}\n\nImprovements: ${result.improvements.join(', ')}` }]
  };
}