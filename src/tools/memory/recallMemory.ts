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

async function saveMemories(memories: MemoryItem[]): Promise<void> {
  await ensureMemoryDir();
  await fs.writeFile(MEMORY_FILE, JSON.stringify(memories, null, 2));
}

async function findMemory(key: string): Promise<MemoryItem | undefined> {
  const memories = await loadMemories();
  return memories.find(m => m.key === key);
}

async function updateLastAccessed(key: string): Promise<void> {
  const memories = await loadMemories();
  const memory = memories.find(m => m.key === key);
  if (memory) {
    memory.lastAccessed = new Date().toISOString();
    await saveMemories(memories);
  }
}

export const recallMemoryDefinition: ToolDefinition = {
  name: 'recall_memory',
  description: 'IMPORTANT: This tool should be automatically called when users say "떠올려", "기억나", "recall", "remember what", "what was", "remind me" or similar keywords. Retrieve information from memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key to retrieve' },
      category: { type: 'string', description: 'Memory category to search in' }
    },
    required: ['key']
  }
};

export async function recallMemory(args: { key: string; category?: string }): Promise<ToolResult> {
  const { key: recallKey, category: recallCategory } = args;
  
  try {
    const memory = await findMemory(recallKey);
    if (memory) {
      await updateLastAccessed(recallKey);
      return {
        content: [{ type: 'text', text: `Memory recalled:\n${JSON.stringify(memory, null, 2)}` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `Memory not found for key: "${recallKey}"` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error recalling memory: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}