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

export const prioritizeMemoryDefinition: ToolDefinition = {
  name: 'prioritize_memory',
  description: 'Automatically prioritize what to save based on importance',
  inputSchema: {
    type: 'object',
    properties: {
      currentTask: { type: 'string', description: 'Current task description' },
      criticalDecisions: { type: 'array', items: { type: 'string' }, description: 'List of critical decisions made' },
      codeChanges: { type: 'array', items: { type: 'string' }, description: 'Important code changes' },
      blockers: { type: 'array', items: { type: 'string' }, description: 'Current blockers or issues' },
      nextSteps: { type: 'array', items: { type: 'string' }, description: 'Planned next steps' }
    },
    required: ['currentTask']
  }
};

export async function prioritizeMemory(args: { 
  currentTask: string; 
  criticalDecisions?: string[]; 
  codeChanges?: string[]; 
  blockers?: string[]; 
  nextSteps?: string[] 
}): Promise<ToolResult> {
  const { currentTask, criticalDecisions = [], codeChanges = [], blockers = [], nextSteps = [] } = args;
  
  try {
    const allMemories = await loadMemories();
    const prioritizedMemories = [];
    
    for (const memory of allMemories) {
      let priority = 0;
      let reason = '';
      
      // Analyze importance based on content
      if (memory.value.includes('error') || memory.value.includes('Error')) {
        priority = 0.9;
        reason = 'Contains error information';
      } else if (memory.value.includes('decision') || memory.value.includes('Decision')) {
        priority = 0.8;
        reason = 'Contains decision information';
      } else if (memory.value.includes('code') || memory.value.includes('function')) {
        priority = 0.7;
        reason = 'Contains code-related information';
      } else if (memory.category === 'context') {
        priority = 0.6;
        reason = 'Context information';
      } else if (memory.category === 'project') {
        priority = 0.7;
        reason = 'Project-related information';
      } else {
        priority = 0.5;
        reason = 'General information';
      }
      
      // Boost priority for memories related to current task
      if (memory.value.toLowerCase().includes(currentTask.toLowerCase())) {
        priority += 0.2;
        reason += ' (related to current task)';
      }
      
      // Boost priority for critical decisions
      for (const decision of criticalDecisions) {
        if (memory.value.toLowerCase().includes(decision.toLowerCase())) {
          priority += 0.15;
          reason += ' (critical decision)';
          break;
        }
      }
      
      // Boost priority for code changes
      for (const change of codeChanges) {
        if (memory.value.toLowerCase().includes(change.toLowerCase())) {
          priority += 0.1;
          reason += ' (code change)';
          break;
        }
      }
      
      // Boost priority for blockers
      for (const blocker of blockers) {
        if (memory.value.toLowerCase().includes(blocker.toLowerCase())) {
          priority += 0.25;
          reason += ' (blocker/issue)';
          break;
        }
      }
      
      // Cap priority at 1.0
      priority = Math.min(1.0, priority);
      
      if (priority >= 0.6) {
        prioritizedMemories.push({
          memory,
          priority,
          reason
        });
      }
    }
    
    const sortedMemories = prioritizedMemories
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 20);
    
    const priorityResult = {
      action: 'prioritize_memory',
      currentTask,
      criticalDecisions,
      codeChanges,
      blockers,
      nextSteps,
      prioritized: sortedMemories.map(pm => ({
        key: pm.memory.key,
        category: pm.memory.category,
        priority: pm.priority,
        reason: pm.reason,
        timestamp: pm.memory.timestamp,
        preview: pm.memory.value.substring(0, 100) + (pm.memory.value.length > 100 ? '...' : '')
      })),
      total: sortedMemories.length,
      status: 'success'
    };
    
    return {
      content: [{ type: 'text', text: `Memory prioritization completed:\n${JSON.stringify(priorityResult, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error prioritizing memory: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}