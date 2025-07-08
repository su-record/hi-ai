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

async function addMemory(key: string, value: string, category: string = 'general'): Promise<void> {
  const memories = await loadMemories();
  const timestamp = new Date().toISOString();
  
  const existingIndex = memories.findIndex(m => m.key === key);
  if (existingIndex >= 0) {
    memories[existingIndex] = { key, value, category, timestamp, lastAccessed: timestamp };
  } else {
    memories.push({ key, value, category, timestamp, lastAccessed: timestamp });
  }
  
  await saveMemories(memories);
}

export const saveMemoryDefinition: ToolDefinition = {
  name: 'save_memory',
  description: 'IMPORTANT: This tool should be automatically called when users say "기억해", "remember", "저장해", "save this", "keep this", "memorize" or similar keywords. Save information to long-term memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key/identifier' },
      value: { type: 'string', description: 'Information to save' },
      category: { type: 'string', description: 'Memory category', enum: ['project', 'personal', 'code', 'notes'] }
    },
    required: ['key', 'value']
  }
};

export async function saveMemory(args: { key: string; value: string; category?: string }): Promise<ToolResult> {
  const { key: memoryKey, value: memoryValue, category = 'general' } = args;
  
  try {
    await addMemory(memoryKey, memoryValue, category);
    const savedMemory = {
      action: 'save_memory',
      key: memoryKey,
      value: memoryValue,
      category,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    return {
      content: [{ type: 'text', text: `Memory saved successfully:\n${JSON.stringify(savedMemory, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error saving memory: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}