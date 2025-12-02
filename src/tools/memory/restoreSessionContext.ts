// Memory management tool - SQLite based (v1.3)

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const restoreSessionContextDefinition: ToolDefinition = {
  name: 'restore_session_context',
  description: 'restore|revert|go back|복원|되돌려 - Restore previous session context',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID to restore' },
      restoreLevel: { type: 'string', description: 'Level of detail to restore', enum: ['essential', 'detailed', 'complete'] },
      filterType: { type: 'string', description: 'Filter context by type', enum: ['all', 'progress', 'decisions', 'code-snippets', 'debugging', 'planning'] }
    },
    required: ['sessionId']
  },
  annotations: {
    title: 'Restore Session',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function restoreSessionContext(args: { sessionId: string; restoreLevel?: string; filterType?: string }): Promise<ToolResult> {
  const { sessionId, restoreLevel = 'detailed', filterType = 'all' } = args;

  try {
    const memoryManager = MemoryManager.getInstance();

    // Get all context memories
    let memories = memoryManager.list('context');

    // Filter by session ID
    memories = memories.filter(m => m.key.includes(sessionId));

    // Filter by context type if not 'all'
    if (filterType !== 'all') {
      memories = memories.filter(m => {
        try {
          const contextData = JSON.parse(m.value);
          return contextData.contextType === filterType;
        } catch {
          return false;
        }
      });
    }

    const maxItems = restoreLevel === 'essential' ? 3 : restoreLevel === 'detailed' ? 10 : 20;
    const limitedMemories = memories.slice(0, maxItems);

    if (limitedMemories.length === 0) {
      return {
        content: [{ type: 'text', text: `✗ No context found for session: ${sessionId}` }]
      };
    }

    let response = `✓ Restored ${limitedMemories.length} context item(s) for session: ${sessionId}\n`;

    limitedMemories.forEach(m => {
      try {
        const data = JSON.parse(m.value);
        response += `\n• ${data.contextType || 'context'} (${data.urgency || 'medium'})`;
        if (data.summary) response += `: ${data.summary}`;
        response += `\n  Time: ${new Date(m.timestamp).toLocaleString()}`;
      } catch {
        response += `\n• ${m.key}\n  Time: ${new Date(m.timestamp).toLocaleString()}`;
      }
    });

    return {
      content: [{ type: 'text', text: response }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}