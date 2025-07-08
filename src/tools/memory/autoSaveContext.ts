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

export const autoSaveContextDefinition: ToolDefinition = {
  name: 'auto_save_context',
  description: 'IMPORTANT: This tool should be automatically called when users say "커밋", "commit", "저장", "save", "checkpoint", "backup" or similar keywords. Automatically save current context',
  inputSchema: {
    type: 'object',
    properties: {
      urgency: { type: 'string', description: 'Urgency level', enum: ['low', 'medium', 'high', 'critical'] },
      contextType: { type: 'string', description: 'Type of context to save', enum: ['progress', 'decisions', 'code-snippets', 'debugging', 'planning'] },
      sessionId: { type: 'string', description: 'Current session identifier' },
      summary: { type: 'string', description: 'Brief summary of current context' }
    },
    required: ['urgency', 'contextType']
  }
};

export async function autoSaveContext(args: { urgency: string; contextType: string; sessionId?: string; summary?: string }): Promise<ToolResult> {
  const { urgency, contextType, sessionId, summary } = args;
  
  try {
    const contextData = {
      timestamp: new Date().toISOString(),
      urgency,
      contextType,
      sessionId,
      summary,
      priority: urgency === 'high' || urgency === 'critical' ? 'critical' : urgency === 'medium' ? 'important' : 'normal'
    };
    
    const contextKey = sessionId ? `session_${sessionId}_context` : `auto_context_${Date.now()}`;
    await addMemory(contextKey, JSON.stringify(contextData), 'context');
    
    const saveResult = {
      action: 'auto_save_context',
      urgency,
      contextType,
      sessionId,
      contextData,
      status: 'success'
    };
    
    return {
      content: [{ type: 'text', text: `Context auto-saved successfully:\n${JSON.stringify(saveResult, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error auto-saving context: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}