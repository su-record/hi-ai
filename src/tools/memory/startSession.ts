// Memory management tool - SQLite based (v1.3)

import { MemoryManager } from '../../lib/MemoryManager.js';
import { promises as fs } from 'fs';
import path from 'path';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

interface CodingGuide {
  name: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  timestamp: string;
  lastUpdated: string;
}

const GUIDES_DIR = path.join(process.cwd(), 'guides');
const GUIDES_FILE = path.join(GUIDES_DIR, 'coding_guides.json');

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
  description: 'hi-ai|hello|안녕|하이아이 - Start session with context',
  inputSchema: {
    type: 'object',
    properties: {
      greeting: { type: 'string', description: 'Greeting message that triggered this action (e.g., "하이아이", "hi-ai")' },
      loadMemory: { type: 'boolean', description: 'Load relevant project memories (default: true)' },
      loadGuides: { type: 'boolean', description: 'Load applicable coding guides (default: true)' },
      restoreContext: { type: 'boolean', description: 'Restore previous session context (default: true)' }
    },
    required: []
  },
  annotations: {
    title: 'Start Session',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
};

export async function startSession(args: { greeting?: string; loadMemory?: boolean; loadGuides?: boolean; restoreContext?: boolean }): Promise<ToolResult> {
  const { greeting = '', loadMemory = true, loadGuides: shouldLoadGuides = true, restoreContext = true } = args;

  try {
    const memoryManager = MemoryManager.getInstance();
    let summary = `${greeting ? greeting + '! ' : ''}Session started.\n`;

    // Load relevant project memories
    if (loadMemory) {
      const projectMemories = memoryManager.list('project');
      const codeMemories = memoryManager.list('code');
      const memories = [...projectMemories, ...codeMemories].slice(0, 5);

      if (memories.length > 0) {
        summary += `\nRecent Project Info:\n`;
        memories.forEach(mem => {
          const preview = mem.value.substring(0, 80);
          summary += `  • ${mem.key}: ${preview}${mem.value.length > 80 ? '...' : ''}\n`;
        });
      }
    }

    // Load coding guides
    if (shouldLoadGuides) {
      const allGuides = await loadGuides();
      const guides = allGuides
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 3);

      if (guides.length > 0) {
        summary += `\nActive Coding Guides:\n`;
        guides.forEach(guide => {
          summary += `  • ${guide.name} (${guide.category}): ${guide.description}\n`;
        });
      }
    }

    // Restore context
    if (restoreContext) {
      const contextMemories = memoryManager.list('context').slice(0, 3);

      if (contextMemories.length > 0) {
        summary += `\nPrevious Context:\n`;
        contextMemories.forEach(ctx => {
          try {
            const data = JSON.parse(ctx.value);
            summary += `  • ${data.urgency?.toUpperCase() || 'MEDIUM'} priority from ${new Date(ctx.timestamp).toLocaleString()}\n`;
          } catch {
            summary += `  • Context from ${new Date(ctx.timestamp).toLocaleString()}\n`;
          }
        });
      }
    }

    summary += '\nReady to continue development! What would you like to work on?';

    return {
      content: [{ type: 'text', text: summary }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `${greeting ? greeting + '! ' : ''}Session started.\n\nReady to begin! What can I help you with?` }]
    };
  }
}