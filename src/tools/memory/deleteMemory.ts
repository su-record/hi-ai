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

async function removeMemory(key: string): Promise<boolean> {
  const memories = await loadMemories();
  const initialLength = memories.length;
  const filtered = memories.filter(m => m.key !== key);
  
  if (filtered.length !== initialLength) {
    await saveMemories(filtered);
    return true;
  }
  return false;
}

export const deleteMemoryDefinition: ToolDefinition = {
  name: 'delete_memory',
  description: 'IMPORTANT: This tool should be automatically called when users say "잊어", "삭제해", "지워", "forget this", "delete memory", "remove", "erase" or similar keywords. Delete specific memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key to delete' }
    },
    required: ['key']
  }
};

export async function deleteMemory(args: { key: string }): Promise<ToolResult> {
  const { key: deleteKey } = args;
  
  try {
    const deleted = await removeMemory(deleteKey);
    if (deleted) {
      const deleteResult = {
        action: 'delete_memory',
        key: deleteKey,
        status: 'success',
        message: `Memory with key "${deleteKey}" has been deleted`
      };
      return {
        content: [{ type: 'text', text: `Memory deleted:\n${JSON.stringify(deleteResult, null, 2)}` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `Memory not found for key: "${deleteKey}"` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error deleting memory: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}