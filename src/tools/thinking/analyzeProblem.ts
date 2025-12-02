// Sequential thinking tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const analyzeProblemDefinition: ToolDefinition = {
  name: 'analyze_problem',
  description: '문제 분석|어떻게 접근|분석해줘|analyze this|how to approach|break this down - Break down complex problem into structured steps',
  inputSchema: {
    type: 'object',
    properties: {
      problem: { type: 'string', description: 'Problem to analyze' },
      domain: { type: 'string', description: 'Problem domain' }
    },
    required: ['problem']
  },
  annotations: {
    title: 'Analyze Problem',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function analyzeProblem(args: { problem: string; domain?: string }): Promise<ToolResult> {
  const { problem, domain = 'general' } = args;
  
  const problemAnalysis = {
    action: 'analyze_problem',
    problem,
    domain,
    analysis: {
      breakdown: [
        'Define the problem clearly',
        'Identify key constraints and requirements',
        'Break down into smaller sub-problems',
        'Determine solution approach',
        'Plan implementation steps'
      ],
      considerations: [
        'What are the inputs and expected outputs?',
        'Are there any edge cases to consider?',
        'What are the performance requirements?',
        'How will this integrate with existing systems?'
      ],
      nextSteps: [
        'Research existing solutions',
        'Create detailed implementation plan',
        'Identify potential risks and mitigation strategies',
        'Define success criteria'
      ]
    },
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Problem: ${problem}\nDomain: ${domain}\n\nBreakdown:\n${problemAnalysis.analysis.breakdown.map((b, i) => `${i+1}. ${b}`).join('\n')}\n\nConsiderations:\n${problemAnalysis.analysis.considerations.map(c => `- ${c}`).join('\n')}\n\nNext Steps:\n${problemAnalysis.analysis.nextSteps.map(n => `- ${n}`).join('\n')}` }]
  };
}