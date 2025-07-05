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

async function searchMemories(query: string, category?: string): Promise<MemoryItem[]> {
  const memories = await loadMemories();
  const searchLower = query.toLowerCase();
  
  return memories.filter(m => {
    const matchesCategory = !category || m.category === category;
    const matchesQuery = m.key.toLowerCase().includes(searchLower) || 
                        m.value.toLowerCase().includes(searchLower);
    return matchesCategory && matchesQuery;
  });
}

export const restoreSessionContextDefinition: ToolDefinition = {
  name: 'restore_session_context',
  description: 'Restore previous session context automatically',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID to restore' },
      restoreLevel: { type: 'string', description: 'Level of detail to restore', enum: ['essential', 'detailed', 'complete'] },
      filterType: { type: 'string', description: 'Filter context by type', enum: ['all', 'progress', 'decisions', 'code-snippets', 'debugging', 'planning'] }
    },
    required: ['sessionId']
  }
};

export async function restoreSessionContext(args: { sessionId: string; restoreLevel?: string; filterType?: string }): Promise<ToolResult> {
  const { sessionId, restoreLevel = 'detailed', filterType = 'all' } = args;
  
  try {
    const memories = await searchMemories('', 'context');
    let filteredMemories = memories;
    
    // Filter by session ID if provided
    if (sessionId) {
      filteredMemories = memories.filter((memory: MemoryItem) => {
        return memory.key.includes(sessionId);
      });
    }
    
    // Filter by context type if not 'all'
    if (filterType !== 'all') {
      filteredMemories = filteredMemories.filter((memory: MemoryItem) => {
        try {
          const contextData = JSON.parse(memory.value);
          return contextData.contextType === filterType;
        } catch {
          return false;
        }
      });
    }
    
    const maxItems = restoreLevel === 'essential' ? 3 : restoreLevel === 'detailed' ? 10 : 20;
    const limitedMemories = filteredMemories
      .sort((a: MemoryItem, b: MemoryItem) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems);
    
    const contextResult = {
      action: 'restore_session_context',
      sessionId,
      restoreLevel,
      filterType,
      restored: limitedMemories.map((memory: MemoryItem) => {
        try {
          return {
            key: memory.key,
            data: JSON.parse(memory.value),
            timestamp: memory.timestamp
          };
        } catch {
          return {
            key: memory.key,
            data: memory.value,
            timestamp: memory.timestamp
          };
        }
      }),
      status: 'success'
    };
    
    return {
      content: [{ type: 'text', text: `Session context restored:\n${JSON.stringify(contextResult, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error restoring context: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}