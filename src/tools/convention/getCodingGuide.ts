// Convention management tool - completely independent

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

async function findGuide(name: string): Promise<CodingGuide | undefined> {
  const guides = await loadGuides();
  return guides.find(g => g.name === name);
}

export const getCodingGuideDefinition: ToolDefinition = {
  name: 'get_coding_guide',
  description: 'Get coding guide for AI to follow',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Guide name to retrieve' },
      category: { type: 'string', description: 'Guide category' }
    },
    required: ['name']
  }
};

export async function getCodingGuide(args: { name: string; category?: string }): Promise<ToolResult> {
  const { name: guideName, category: guideCategory } = args;
  
  try {
    const guide = await findGuide(guideName);
    if (guide) {
      return {
        content: [{ type: 'text', text: `CODING GUIDE: ${guide.name}\n\nCategory: ${guide.category}\nDescription: ${guide.description}\n\nGUIDELINES TO FOLLOW:\n${guide.content}\n\nTags: ${guide.tags.join(', ')}\nLast Updated: ${guide.lastUpdated}` }]
      };
    } else {
      return {
        content: [{ type: 'text', text: `Coding guide not found: "${guideName}". Use list_coding_guides to see available guides.` }]
      };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error retrieving guide: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}