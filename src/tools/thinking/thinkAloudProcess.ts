// Sequential thinking tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const thinkAloudProcessDefinition: ToolDefinition = {
  name: 'think_aloud_process',
  description: '생각해봐|고민해봐|어떻게 생각해|think about it|let me think|reasoning - Generate think-aloud reasoning process',
  inputSchema: {
    type: 'object',
    properties: {
      scenario: { type: 'string', description: 'Scenario or problem to think through' },
      perspective: { type: 'string', description: 'Thinking perspective', enum: ['analytical', 'creative', 'systematic', 'critical'] },
      verbosity: { type: 'string', description: 'Verbosity level', enum: ['concise', 'moderate', 'verbose'] }
    },
    required: ['scenario']
  },
  annotations: {
    title: 'Think Aloud',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function thinkAloudProcess(args: { scenario: string; perspective?: string; verbosity?: string }): Promise<ToolResult> {
  const { scenario, perspective = 'analytical', verbosity = 'moderate' } = args;
  
  const thoughtCount = verbosity === 'concise' ? 3 : verbosity === 'moderate' ? 5 : 8;
  const thinkAloudProcess = {
    action: 'think_aloud_process',
    scenario,
    perspective,
    verbosity,
    thoughtProcess: Array.from({ length: thoughtCount }, (_, i) => {
      const thoughtNum = i + 1;
      let thoughtStyle = '';
      
      switch (perspective) {
        case 'analytical':
          thoughtStyle = `Analyzing: Let me examine ${scenario} systematically...`;
          break;
        case 'creative':
          thoughtStyle = `Brainstorming: What if I approach ${scenario} differently...`;
          break;
        case 'systematic':
          thoughtStyle = `Step ${thoughtNum}: Following systematic approach to ${scenario}...`;
          break;
        case 'critical':
          thoughtStyle = `Questioning: What assumptions am I making about ${scenario}...`;
          break;
      }
      
      return {
        stepNumber: thoughtNum,
        thought: thoughtStyle,
        reasoning: `In step ${thoughtNum}, I need to consider the implications of ${scenario} from a ${perspective} perspective`,
        questions: [
          `What do I know about this aspect of ${scenario}?`,
          `What don't I know yet?`,
          `What should I explore next?`
        ],
        conclusions: [
          `Based on current analysis...`,
          `This leads me to think that...`,
          `Next I should focus on...`
        ],
        confidence: Math.min(95, 60 + (thoughtNum * 5))
      };
    }),
    metacognition: {
      thinkingStyle: perspective,
      processEffectiveness: verbosity === 'verbose' ? 'highly detailed' : verbosity === 'moderate' ? 'balanced' : 'efficient',
      nextSteps: [
        'Review thinking process for gaps',
        'Validate conclusions against evidence', 
        'Plan concrete actions based on analysis'
      ]
    },
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Scenario: ${scenario}\nPerspective: ${perspective}\nThoughts: ${thoughtCount}\n${thinkAloudProcess.thoughtProcess.map((t, i) => `${i+1}. ${t.thought} (confidence: ${t.confidence}%)`).join('\n')}\n\nNext: ${thinkAloudProcess.metacognition.nextSteps.join(', ')}` }]
  };
}