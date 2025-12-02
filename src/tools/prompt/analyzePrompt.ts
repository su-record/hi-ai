// Prompt analysis tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const analyzePromptDefinition: ToolDefinition = {
  name: 'analyze_prompt',
  description: '프롬프트 분석|평가|점수|얼마나 좋은지|analyze prompt|rate this|score|how good|prompt quality - Analyze prompt quality',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Prompt to analyze' },
      criteria: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific criteria to evaluate (default: all)'
      }
    },
    required: ['prompt']
  },
  annotations: {
    title: 'Analyze Prompt',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function analyzePrompt(args: { prompt: string; criteria?: string[] }): Promise<ToolResult> {
  const { prompt, criteria = ['clarity', 'specificity', 'context', 'structure'] } = args;
  
  // Initialize scores with explicit types
  const scores: Record<string, number> = {};
  const feedback: Record<string, string[]> = {};
  
  // Analyze clarity (0-10)
  if (criteria.includes('clarity')) {
    let clarityScore = 5.0;
    const clarityFeedback: string[] = [];
    
    if (prompt.length < 20) {
      clarityScore -= 2.0;
      clarityFeedback.push('프롬프트가 너무 짧습니다');
    }
    
    if (prompt.includes('?') || /\b(해주세요|부탁|요청)\b/.test(prompt)) {
      clarityScore += 2.0;
      clarityFeedback.push('명확한 요청 형태 ✓');
    }
    
    if (prompt.split(',').length > 5 || prompt.split('.').length > 10) {
      clarityScore -= 1.0;
      clarityFeedback.push('문장이 너무 복잡합니다');
    }
    
    scores.clarity = Math.max(0, Math.min(10, clarityScore));
    feedback.clarity = clarityFeedback;
  }
  
  // Analyze specificity (0-10)
  if (criteria.includes('specificity')) {
    let specificityScore = 5.0;
    const specificityFeedback: string[] = [];
    
    const specificKeywords = ['구체적', '정확히', '예시', '예를 들어'];
    const hasSpecificWords = specificKeywords.some(word => prompt.includes(word));
    if (hasSpecificWords) {
      specificityScore += 2.0;
      specificityFeedback.push('구체적인 표현 사용 ✓');
    }
    
    const techTerms = /\b(JavaScript|Python|React|Node\.js|API|데이터베이스)\b/i;
    if (techTerms.test(prompt)) {
      specificityScore += 2.0;
      specificityFeedback.push('기술 용어 포함 ✓');
    }
    
    if (!prompt.match(/\d+/) && prompt.length > 50) {
      specificityScore -= 1.0;
      specificityFeedback.push('수치나 구체적 데이터 부족');
    }
    
    scores.specificity = Math.max(0, Math.min(10, specificityScore));
    feedback.specificity = specificityFeedback;
  }
  
  // Analyze context (0-10)
  if (criteria.includes('context')) {
    let contextScore = 5.0;
    const contextFeedback: string[] = [];
    
    const contextKeywords = ['배경', '목적', '이유', '상황', '현재', '문제'];
    const contextCount = contextKeywords.filter(word => prompt.includes(word)).length;
    contextScore += contextCount * 1.5;
    
    if (contextCount > 0) {
      contextFeedback.push(`배경 정보 포함 (${contextCount}개 키워드) ✓`);
    } else {
      contextFeedback.push('배경 정보 부족');
    }
    
    if (prompt.split('\n').length > 2) {
      contextScore += 1.0;
      contextFeedback.push('구조화된 설명 ✓');
    }
    
    scores.context = Math.max(0, Math.min(10, contextScore));
    feedback.context = contextFeedback;
  }
  
  // Analyze structure (0-10)
  if (criteria.includes('structure')) {
    let structureScore = 5.0;
    const structureFeedback: string[] = [];
    
    if (prompt.includes('\n')) {
      structureScore += 2.0;
      structureFeedback.push('줄바꿈 사용 ✓');
    }
    
    if (/[1-9]\.|[-•]/.test(prompt)) {
      structureScore += 2.0;
      structureFeedback.push('목록 형식 사용 ✓');
    }
    
    if (prompt.includes('**') || prompt.includes('##')) {
      structureScore += 1.0;
      structureFeedback.push('마크다운 형식 사용 ✓');
    }
    
    scores.structure = Math.max(0, Math.min(10, structureScore));
    feedback.structure = structureFeedback;
  }
  
  // Calculate total score
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (scores.clarity < 6) {
    recommendations.push('💡 질문이나 요청을 더 명확하게 표현하세요');
  }
  if (scores.specificity < 6) {
    recommendations.push('💡 구체적인 예시나 기술 사양을 추가하세요');
  }
  if (scores.context < 6) {
    recommendations.push('💡 작업의 배경과 목적을 설명하세요');
  }
  if (scores.structure < 6) {
    recommendations.push('💡 번호나 불릿 포인트로 구조화하세요');
  }
  
  // Identify strengths and weaknesses
  const strengths = Object.entries(scores)
    .filter(([_, score]) => score >= 7)
    .map(([category, score]) => `✨ ${category}: 우수함 (${score.toFixed(1)}/10)`);
    
  const weaknesses = Object.entries(scores)
    .filter(([_, score]) => score < 5)
    .map(([category, score]) => `⚠️ ${category}: 개선 필요 (${score.toFixed(1)}/10)`);
  
  const analysis = {
    action: 'analyze_prompt',
    prompt,
    totalScore: parseFloat(totalScore.toFixed(1)),
    scores: Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, parseFloat(v.toFixed(1))])
    ),
    feedback,
    strengths,
    weaknesses,
    recommendations,
    grade: totalScore >= 8 ? 'A' : totalScore >= 6 ? 'B' : totalScore >= 4 ? 'C' : 'D',
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Score: ${analysis.totalScore}/10 (Grade: ${analysis.grade})\n\nScores:\n${Object.entries(analysis.scores).map(([k, v]) => `- ${k}: ${v}/10`).join('\n')}\n\nStrengths:\n${analysis.strengths.length > 0 ? analysis.strengths.join('\n') : 'None identified'}\n\nWeaknesses:\n${analysis.weaknesses.length > 0 ? analysis.weaknesses.join('\n') : 'None identified'}\n\nRecommendations:\n${analysis.recommendations.map(r => `- ${r}`).join('\n')}` }]
  };
}