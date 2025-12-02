// Memory management tool - completely independent

import { MemoryManager, MemoryItem } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const prioritizeMemoryDefinition: ToolDefinition = {
  name: 'prioritize_memory',
  description: '중요한 거|우선순위|prioritize|important|what matters|priority - Prioritize memories by importance',
  inputSchema: {
    type: 'object',
    properties: {
      currentTask: { type: 'string', description: 'Current task description' },
      criticalDecisions: { type: 'array', items: { type: 'string' }, description: 'List of critical decisions made' },
      codeChanges: { type: 'array', items: { type: 'string' }, description: 'Important code changes' },
      blockers: { type: 'array', items: { type: 'string' }, description: 'Current blockers or issues' },
      nextSteps: { type: 'array', items: { type: 'string' }, description: 'Planned next steps' }
    },
    required: ['currentTask']
  },
  annotations: {
    title: 'Prioritize Memory',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function prioritizeMemory(args: {
  currentTask: string;
  criticalDecisions?: string[];
  codeChanges?: string[];
  blockers?: string[];
  nextSteps?: string[]
}): Promise<ToolResult> {
  const { currentTask, criticalDecisions = [], codeChanges = [], blockers = [], nextSteps = [] } = args;

  try {
    const mm = MemoryManager.getInstance();
    const allMemories = mm.list();
    const prioritizedMemories: Array<{ memory: MemoryItem; priority: number; reason: string }> = [];

    for (const memory of allMemories) {
      let priority = 0;
      let reason = '';

      // Analyze importance based on content
      if (memory.value.includes('error') || memory.value.includes('Error')) {
        priority = 0.9;
        reason = 'error info';
      } else if (memory.value.includes('decision') || memory.value.includes('Decision')) {
        priority = 0.8;
        reason = 'decision';
      } else if (memory.value.includes('code') || memory.value.includes('function')) {
        priority = 0.7;
        reason = 'code-related';
      } else if (memory.category === 'context') {
        priority = 0.6;
        reason = 'context';
      } else if (memory.category === 'project') {
        priority = 0.7;
        reason = 'project';
      } else {
        priority = 0.5;
        reason = 'general';
      }

      // Boost priority for memories related to current task
      if (memory.value.toLowerCase().includes(currentTask.toLowerCase())) {
        priority += 0.2;
        reason += ' +task';
      }

      // Boost priority for critical decisions
      for (const decision of criticalDecisions) {
        if (memory.value.toLowerCase().includes(decision.toLowerCase())) {
          priority += 0.15;
          reason += ' +critical';
          break;
        }
      }

      // Boost priority for code changes
      for (const change of codeChanges) {
        if (memory.value.toLowerCase().includes(change.toLowerCase())) {
          priority += 0.1;
          reason += ' +change';
          break;
        }
      }

      // Boost priority for blockers
      for (const blocker of blockers) {
        if (memory.value.toLowerCase().includes(blocker.toLowerCase())) {
          priority += 0.25;
          reason += ' +blocker';
          break;
        }
      }

      // Cap priority at 1.0
      priority = Math.min(1.0, priority);

      if (priority >= 0.6) {
        prioritizedMemories.push({ memory, priority, reason });

        // Update priority in database
        mm.setPriority(memory.key, Math.floor(priority * 100));
      }
    }

    const sortedMemories = prioritizedMemories
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20);

    const resultList = sortedMemories.map(pm =>
      `• [${(pm.priority * 100).toFixed(0)}%] ${pm.memory.key} (${pm.reason}): ${pm.memory.value.substring(0, 60)}${pm.memory.value.length > 60 ? '...' : ''}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `✓ Prioritized ${sortedMemories.length} memories for "${currentTask}":\n${resultList || 'None'}`
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}