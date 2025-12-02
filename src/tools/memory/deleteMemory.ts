// Memory management tool - completely independent

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const deleteMemoryDefinition: ToolDefinition = {
  name: 'delete_memory',
  description: '잊어|삭제해|지워|forget|delete|remove|erase - Delete specific memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key to delete' }
    },
    required: ['key']
  },
  annotations: {
    title: 'Delete Memory',
    audience: ['user', 'assistant'],
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function deleteMemory(args: { key: string }): Promise<ToolResult> {
  const { key: deleteKey } = args;

  try {
    const mm = MemoryManager.getInstance();
    const deleted = mm.delete(deleteKey);

    if (deleted) {
      return {
        content: [{ type: 'text', text: `✓ Deleted memory: "${deleteKey}"` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `✗ Memory not found: "${deleteKey}"` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}