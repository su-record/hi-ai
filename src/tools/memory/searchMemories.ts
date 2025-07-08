// Memory management tool - completely independent

import { promises as fs } from 'fs';
import path from 'path';

interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  [x: string]: unknown;
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

export async function searchMemories(query: string, category?: string): Promise<MemoryItem[]> {
  const memories = await loadMemories();
  const searchLower = query.toLowerCase();
  
  return memories.filter(m => {
    const matchesCategory = !category || m.category === category;
    const matchesQuery = m.key.toLowerCase().includes(searchLower) || 
                        m.value.toLowerCase().includes(searchLower);
    return matchesCategory && matchesQuery;
  });
}

export const searchMemoriesDefinition: ToolDefinition = {
  name: 'search_memories',
  description: 'IMPORTANT: This tool should be automatically called when users say "찾아", "검색", "기억 중에", "search memory", "find in memories", "look for" or similar keywords. Search memories by content',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      category: { type: 'string', description: 'Category to search in' }
    },
    required: ['query']
  }
};

export async function searchMemoriesHandler(args: { query: string; category?: string }): Promise<ToolResult> {
  const { query, category: searchCategory } = args;
  
  try {
    const results = await searchMemories(query, searchCategory);
    const searchResults = {
      action: 'search_memories',
      query,
      category: searchCategory,
      results: results.map(m => ({
        key: m.key,
        value: m.value.substring(0, 100) + (m.value.length > 100 ? '...' : ''),
        category: m.category,
        lastAccessed: m.lastAccessed
      })),
      total: results.length,
      status: 'success'
    };
    
    return {
      content: [{ type: 'text', text: `Memory search results:\n${JSON.stringify(searchResults, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error searching memories: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}