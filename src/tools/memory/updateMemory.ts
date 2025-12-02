// Memory management tool - completely independent

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const updateMemoryDefinition: ToolDefinition = {
  name: 'update_memory',
  description: '수정해|업데이트|바꿔|update|change|modify|edit - Update existing memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key to update' },
      value: { type: 'string', description: 'New value' },
      append: { type: 'boolean', description: 'Append to existing value' }
    },
    required: ['key', 'value']
  },
  annotations: {
    title: 'Update Memory',
    audience: ['user', 'assistant'],
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function updateMemory(args: { key: string; value: string; append?: boolean }): Promise<ToolResult> {
  const { key: updateKey, value: updateValue, append = false } = args;

  try {
    const mm = MemoryManager.getInstance();
    const existingMemory = mm.recall(updateKey);

    if (existingMemory) {
      const newValue = append ? existingMemory.value + ' ' + updateValue : updateValue;
      mm.update(updateKey, newValue);

      return {
        content: [{
          type: 'text',
          text: `✓ ${append ? 'Appended to' : 'Updated'} memory: "${updateKey}"`
        }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `✗ Memory not found: "${updateKey}". Use save_memory to create new memory.` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}