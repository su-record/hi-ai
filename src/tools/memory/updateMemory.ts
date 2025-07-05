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

export const updateMemoryDefinition: ToolDefinition = {
  name: 'update_memory',
  description: 'Update existing memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Memory key to update' },
      value: { type: 'string', description: 'New value' },
      append: { type: 'boolean', description: 'Append to existing value' }
    },
    required: ['key', 'value']
  }
};

export async function updateMemory(args: { key: string; value: string; append?: boolean }): Promise<ToolResult> {
  const { key: updateKey, value: updateValue, append = false } = args;
  
  try {
    const existingMemory = await findMemory(updateKey);
    if (existingMemory) {
      const newValue = append ? existingMemory.value + ' ' + updateValue : updateValue;
      await addMemory(updateKey, newValue, existingMemory.category);
      
      const updateResult = {
        action: 'update_memory',
        key: updateKey,
        value: newValue,
        append,
        status: 'success',
        message: `Memory "${updateKey}" has been ${append ? 'appended to' : 'updated'}`
      };
      
      return {
        content: [{ type: 'text', text: `Memory updated:\n${JSON.stringify(updateResult, null, 2)}` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `Memory not found for key: "${updateKey}". Use save_memory to create new memory.` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error updating memory: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}