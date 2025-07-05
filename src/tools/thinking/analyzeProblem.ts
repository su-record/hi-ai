// Sequential thinking tool - completely independent

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

export const analyzeProblemDefinition: ToolDefinition = {
  name: 'analyze_problem',
  description: 'Break down complex problem into structured steps',
  inputSchema: {
    type: 'object',
    properties: {
      problem: { type: 'string', description: 'Problem to analyze' },
      domain: { type: 'string', description: 'Problem domain' }
    },
    required: ['problem']
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
    content: [{ type: 'text', text: `Problem Analysis:\n${JSON.stringify(problemAnalysis, null, 2)}` }]
  };
}