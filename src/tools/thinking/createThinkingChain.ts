// Sequential thinking tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const createThinkingChainDefinition: ToolDefinition = {
  name: 'create_thinking_chain',
  description: '생각 과정|사고 흐름|연쇄적으로|thinking process|chain of thought|reasoning chain - Create sequential thinking chain',
  inputSchema: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Topic to think about' },
      steps: { type: 'number', description: 'Number of thinking steps' }
    },
    required: ['topic']
  },
  annotations: {
    title: 'Create Thinking Chain',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function createThinkingChain(args: { topic: string; steps?: number }): Promise<ToolResult> {
  const { topic, steps = 5 } = args;
  
  const thinkingChain = {
    action: 'create_thinking_chain',
    topic,
    steps,
    chain: Array.from({ length: steps }, (_, i) => ({
      step: i + 1,
      title: `Step ${i + 1}: Analyze ${topic}`,
      content: `Think about ${topic} from perspective ${i + 1}`,
      questions: [
        `What are the key aspects of ${topic}?`,
        `How does this relate to the overall problem?`,
        `What are the potential implications?`
      ]
    })),
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Topic: ${topic}\nSteps: ${steps}\n\n${thinkingChain.chain.map(s => `${s.step}. ${s.title}\n   ${s.content}\n   Q: ${s.questions.join(', ')}`).join('\n\n')}` }]
  };
}