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

interface CodingGuide {
  name: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  timestamp: string;
  lastUpdated: string;
}

const MEMORY_DIR = path.join(process.cwd(), 'memories');
const MEMORY_FILE = path.join(MEMORY_DIR, 'memories.json');
const GUIDES_DIR = path.join(process.cwd(), 'guides');
const GUIDES_FILE = path.join(GUIDES_DIR, 'coding_guides.json');

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

async function ensureGuidesDir() {
  try {
    await fs.access(GUIDES_DIR);
  } catch {
    await fs.mkdir(GUIDES_DIR, { recursive: true });
  }
}

async function loadGuides(): Promise<CodingGuide[]> {
  try {
    await ensureGuidesDir();
    const data = await fs.readFile(GUIDES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export const startSessionDefinition: ToolDefinition = {
  name: 'start_session',
  description: 'IMPORTANT: This tool should be automatically called when users greet with "하이아이", "hi-ai", "안녕", "hello", or similar greetings. It loads project context, previous memories, and restores the last session state to continue work seamlessly.',
  inputSchema: {
    type: 'object',
    properties: {
      greeting: { type: 'string', description: 'Greeting message that triggered this action (e.g., "하이아이", "hi-ai")' },
      loadMemory: { type: 'boolean', description: 'Load relevant project memories (default: true)' },
      loadGuides: { type: 'boolean', description: 'Load applicable coding guides (default: true)' },
      restoreContext: { type: 'boolean', description: 'Restore previous session context (default: true)' }
    },
    required: []
  }
};

export async function startSession(args: { greeting?: string; loadMemory?: boolean; loadGuides?: boolean; restoreContext?: boolean }): Promise<ToolResult> {
  const { greeting = '', loadMemory = true, loadGuides: shouldLoadGuides = true, restoreContext = true } = args;
  
  try {
    const sessionData: any = {
      action: 'start_session',
      greeting,
      timestamp: new Date().toISOString(),
      loaded: {
        memories: [],
        guides: [],
        context: []
      }
    };
    
    // Load relevant project memories
    if (loadMemory) {
      const projectMemories = await searchMemories('project', 'project');
      const codeMemories = await searchMemories('', 'code');
      sessionData.loaded.memories = [...projectMemories, ...codeMemories]
        .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
        .slice(0, 5);
    }
    
    // Load coding guides
    if (shouldLoadGuides) {
      const allGuides = await loadGuides();
      sessionData.loaded.guides = allGuides
        .sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 3);
    }
    
    // Restore context
    if (restoreContext) {
      const contextMemories = await searchMemories('', 'context');
      sessionData.loaded.context = contextMemories
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
    }
    
    // Generate session summary
    let summary = `${greeting ? greeting + '! ' : ''}Session started successfully.\n\n`;
    
    if (sessionData.loaded.memories.length > 0) {
      summary += `📁 Recent Project Info:\n`;
      sessionData.loaded.memories.forEach((mem: any) => {
        summary += `  • ${mem.key}: ${mem.value.substring(0, 80)}${mem.value.length > 80 ? '...' : ''}\n`;
      });
      summary += '\n';
    }
    
    if (sessionData.loaded.guides.length > 0) {
      summary += `📋 Active Coding Guides:\n`;
      sessionData.loaded.guides.forEach((guide: any) => {
        summary += `  • ${guide.name} (${guide.category}): ${guide.description}\n`;
      });
      summary += '\n';
    }
    
    if (sessionData.loaded.context.length > 0) {
      summary += `🔄 Previous Context:\n`;
      sessionData.loaded.context.forEach((ctx: any) => {
        try {
          const contextData = JSON.parse(ctx.value);
          summary += `  • ${contextData.urgency?.toUpperCase() || 'MEDIUM'} priority context from ${new Date(ctx.timestamp).toLocaleString()}\n`;
        } catch {
          summary += `  • Context from ${new Date(ctx.timestamp).toLocaleString()}\n`;
        }
      });
      summary += '\n';
    }
    
    summary += 'Ready to continue development! What would you like to work on?';
    
    sessionData.summary = summary;
    sessionData.status = 'success';
    
    return {
      content: [{ type: 'text', text: summary }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `${greeting ? greeting + '! ' : ''}Session started, but encountered issues loading context: ${error instanceof Error ? error.message : 'Unknown error'}\n\nReady to begin fresh! What can I help you with?` }]
    };
  }
}