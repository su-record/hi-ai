// Sequential thinking tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const stepByStepAnalysisDefinition: ToolDefinition = {
  name: 'step_by_step_analysis',
  description: '단계별|차근차근|하나씩|step by step|one by one|gradually - Perform detailed step-by-step analysis',
  inputSchema: {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'Task to analyze step by step' },
      context: { type: 'string', description: 'Additional context for the task' },
      detailLevel: { type: 'string', description: 'Level of detail', enum: ['basic', 'detailed', 'comprehensive'] }
    },
    required: ['task']
  },
  annotations: {
    title: 'Step-by-Step Analysis',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function stepByStepAnalysis(args: { task: string; context?: string; detailLevel?: string }): Promise<ToolResult> {
  const { task, context = '', detailLevel = 'detailed' } = args;
  
  const stepCount = detailLevel === 'basic' ? 3 : detailLevel === 'detailed' ? 5 : 7;
  const stepAnalysis = {
    action: 'step_by_step_analysis',
    task,
    context,
    detailLevel,
    steps: Array.from({ length: stepCount }, (_, i) => {
      const stepNum = i + 1;
      return {
        stepNumber: stepNum,
        title: `Step ${stepNum}: ${task} - Phase ${stepNum}`,
        description: `Detailed analysis of ${task} in step ${stepNum}`,
        actions: [
          `Analyze requirements for step ${stepNum}`,
          `Identify dependencies and prerequisites`,
          `Execute the planned actions`,
          `Validate results and check for issues`,
          `Prepare for next step`
        ],
        checkpoints: [
          `Verify step ${stepNum} requirements are met`,
          `Confirm outputs are as expected`,
          `Check for any blocking issues`
        ],
        estimatedTime: detailLevel === 'comprehensive' ? `${stepNum * 10} minutes` : `${stepNum * 5} minutes`
      };
    }),
    summary: {
      totalSteps: stepCount,
      estimatedTotalTime: detailLevel === 'comprehensive' ? `${stepCount * 35} minutes` : `${stepCount * 20} minutes`,
      complexity: detailLevel === 'basic' ? 'low' : detailLevel === 'detailed' ? 'medium' : 'high'
    },
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Task: ${task}\nDetail: ${detailLevel}\nSteps: ${stepCount}\n\n${stepAnalysis.steps.map(s => `Step ${s.stepNumber}: ${s.title}\n  Time: ${s.estimatedTime}\n  Actions: ${s.actions.join(', ')}\n  Checkpoints: ${s.checkpoints.join(', ')}`).join('\n\n')}\n\nTotal Time: ${stepAnalysis.summary.estimatedTotalTime} | Complexity: ${stepAnalysis.summary.complexity}` }]
  };
}