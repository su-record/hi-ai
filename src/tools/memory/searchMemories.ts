// Memory management tool - completely independent

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const searchMemoriesDefinition: ToolDefinition = {
  name: 'search_memories',
  description: '찾아|검색|기억 중에|search|find|look for - Search memories by content',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      category: { type: 'string', description: 'Category to search in' },
      projectPath: { type: 'string', description: 'Project directory path for project-specific memory' }
    },
    required: ['query']
  },
  annotations: {
    title: 'Search Memories',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function searchMemoriesHandler(args: { query: string; category?: string; projectPath?: string }): Promise<ToolResult> {
  const { query, projectPath } = args;

  try {
    const mm = MemoryManager.getInstance(projectPath);
    const results = mm.search(query);

    const resultList = results.map(m =>
      `• ${m.key} (${m.category}): ${m.value.substring(0, 100)}${m.value.length > 100 ? '...' : ''}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `✓ Found ${results.length} matches for "${query}":\n${resultList || 'None'}`
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}