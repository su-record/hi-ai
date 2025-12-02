// Memory management tool - SQLite based with context compression (v1.3)

import { MemoryManager } from '../../lib/MemoryManager.js';
import { ContextCompressor } from '../../lib/ContextCompressor.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const autoSaveContextDefinition: ToolDefinition = {
  name: 'auto_save_context',
  description: 'commit|save|checkpoint|backup|커밋|저장|compress - Auto-save and compress context',
  inputSchema: {
    type: 'object',
    properties: {
      urgency: { type: 'string', description: 'Urgency level', enum: ['low', 'medium', 'high', 'critical'] },
      contextType: { type: 'string', description: 'Type of context to save', enum: ['progress', 'decisions', 'code-snippets', 'debugging', 'planning'] },
      sessionId: { type: 'string', description: 'Current session identifier' },
      summary: { type: 'string', description: 'Brief summary of current context' },
      fullContext: { type: 'string', description: 'Full context to compress and save' },
      compress: { type: 'boolean', description: 'Enable smart compression (default: true)' }
    },
    required: ['urgency', 'contextType']
  },
  annotations: {
    title: 'Auto-Save Context',
    audience: ['user', 'assistant'],
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function autoSaveContext(args: {
  urgency: string;
  contextType: string;
  sessionId?: string;
  summary?: string;
  fullContext?: string;
  compress?: boolean;
}): Promise<ToolResult> {
  const { urgency, contextType, sessionId, summary, fullContext, compress = true } = args;

  try {
    const memoryManager = MemoryManager.getInstance();

    let contextToSave = summary || '';
    let compressionStats = null;

    // Apply smart compression if full context provided and compression enabled
    if (fullContext && compress) {
      const targetTokens = urgency === 'critical' ? 6000 : urgency === 'high' ? 4000 : 2000;
      const compressionResult = ContextCompressor.compress(fullContext, targetTokens);

      contextToSave = compressionResult.compressed;
      compressionStats = {
        originalTokens: ContextCompressor.estimateTokens(fullContext),
        compressedTokens: ContextCompressor.estimateTokens(compressionResult.compressed),
        ratio: Math.round(compressionResult.compressionRatio * 100),
        removed: compressionResult.removedSections.length
      };
    } else if (fullContext) {
      contextToSave = fullContext;
    }

    const contextData = {
      timestamp: new Date().toISOString(),
      urgency,
      contextType,
      sessionId,
      summary,
      context: contextToSave,
      compressed: compress && !!fullContext,
      compressionStats
    };

    const priority = urgency === 'high' || urgency === 'critical' ? 2 : urgency === 'medium' ? 1 : 0;
    const contextKey = sessionId ? `context:session_${sessionId}_${Date.now()}` : `context:${Date.now()}`;

    memoryManager.save(contextKey, JSON.stringify(contextData), 'context', priority);

    let resultText = `✓ Context saved: ${contextType} (${urgency})`;
    if (sessionId) resultText += `\nSession: ${sessionId}`;
    if (compressionStats) {
      resultText += `\nCompressed: ${compressionStats.originalTokens} → ${compressionStats.compressedTokens} tokens (${compressionStats.ratio}%)`;
      resultText += `\nRemoved: ${compressionStats.removed} low-priority sections`;
    }
    if (summary) resultText += `\n${summary}`;

    return {
      content: [{
        type: 'text',
        text: resultText
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}