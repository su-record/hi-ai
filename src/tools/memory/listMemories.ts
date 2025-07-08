// Memory management tool - completely independent

import { promises as fs } from 'fs';
import path from 'path';

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

interface MemoryItem {
  key: string;
  value: string;
  category: string;
  timestamp: string;
  lastAccessed: string;
}

const MEMORY_DIR = path.join(process.cwd(), 'memories');
const MEMORY_FILE = path.join(MEMORY_DIR, 'memories.json');

async function ensureMemoryDir() {
  try {
    await fs.access(MEMORY_DIR);
  } catch {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  }
}

async function loadMemories(): Promise<MemoryItem[]> {
  try {
    await ensureMemoryDir();
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export const listMemoriesDefinition: ToolDefinition = {
  name: 'list_memories',
  description: 'IMPORTANT: This tool should be automatically called when users say "뭐 있었지", "저장된 거", "목록", "what did I save", "list memories", "show saved" or ask about stored items. List all stored memories',
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Filter by category' },
      limit: { type: 'number', description: 'Maximum number of results' }
    },
    required: []
  }
};

export async function listMemories(args: { category?: string; limit?: number }): Promise<ToolResult> {
  const { category: listCategory, limit = 10 } = args;
  
  try {
    const allMemories = await loadMemories();
    const filteredMemories = listCategory 
      ? allMemories.filter(m => m.category === listCategory)
      : allMemories;
    
    const limitedMemories = filteredMemories
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, limit);

    const memoryList = {
      action: 'list_memories',
      category: listCategory,
      limit,
      memories: limitedMemories.map(m => ({
        key: m.key,
        category: m.category,
        lastAccessed: m.lastAccessed,
        preview: m.value.substring(0, 50) + (m.value.length > 50 ? '...' : '')
      })),
      total: filteredMemories.length,
      status: 'success'
    };
    
    return {
      content: [{ type: 'text', text: `Memory list:\n${JSON.stringify(memoryList, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error listing memories: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}