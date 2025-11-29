#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';

// ============================================================================
// TOOL IMPORTS - Organized by Category
// ============================================================================

// Time Utils
import { getCurrentTimeDefinition, getCurrentTime } from './tools/time/getCurrentTime.js';

// Semantic Code Analysis
import { findSymbolDefinition, findSymbol } from './tools/semantic/findSymbol.js';
import { findReferencesDefinition, findReferences } from './tools/semantic/findReferences.js';
import { analyzeDependencyGraphDefinition, analyzeDependencyGraph } from './tools/semantic/analyzeDependencyGraph.js';

// Sequential Thinking
import { createThinkingChainDefinition, createThinkingChain } from './tools/thinking/createThinkingChain.js';
import { analyzeProblemDefinition, analyzeProblem } from './tools/thinking/analyzeProblem.js';
import { stepByStepAnalysisDefinition, stepByStepAnalysis } from './tools/thinking/stepByStepAnalysis.js';
import { formatAsPlanDefinition, formatAsPlan } from './tools/thinking/formatAsPlan.js';

// Memory Management (Basic)
import { saveMemoryDefinition, saveMemory } from './tools/memory/saveMemory.js';
import { recallMemoryDefinition, recallMemory } from './tools/memory/recallMemory.js';
import { listMemoriesDefinition, listMemories } from './tools/memory/listMemories.js';
import { deleteMemoryDefinition, deleteMemory } from './tools/memory/deleteMemory.js';
import { updateMemoryDefinition, updateMemory } from './tools/memory/updateMemory.js';
import { prioritizeMemoryDefinition, prioritizeMemory } from './tools/memory/prioritizeMemory.js';

// Memory Management (Graph - v2.0 NEW)
import { linkMemoriesDefinition, linkMemories } from './tools/memory/linkMemories.js';
import { getMemoryGraphDefinition, getMemoryGraph } from './tools/memory/getMemoryGraph.js';
import { searchMemoriesAdvancedDefinition, searchMemoriesAdvanced } from './tools/memory/searchMemoriesAdvanced.js';
import { createMemoryTimelineDefinition, createMemoryTimeline } from './tools/memory/createMemoryTimeline.js';

// Code Quality & Convention
import { getCodingGuideDefinition, getCodingGuide } from './tools/convention/getCodingGuide.js';
import { applyQualityRulesDefinition, applyQualityRules } from './tools/convention/applyQualityRules.js';
import { validateCodeQualityDefinition, validateCodeQuality } from './tools/convention/validateCodeQuality.js';
import { analyzeComplexityDefinition, analyzeComplexity } from './tools/convention/analyzeComplexity.js';
import { checkCouplingCohesionDefinition, checkCouplingCohesion } from './tools/convention/checkCouplingCohesion.js';
import { suggestImprovementsDefinition, suggestImprovements } from './tools/convention/suggestImprovements.js';

// Planning
import { generatePrdDefinition, generatePrd } from './tools/planning/generatePrd.js';
import { createUserStoriesDefinition, createUserStories } from './tools/planning/createUserStories.js';
import { analyzeRequirementsDefinition, analyzeRequirements } from './tools/planning/analyzeRequirements.js';
import { featureRoadmapDefinition, featureRoadmap } from './tools/planning/featureRoadmap.js';

// Prompt Engineering
import { enhancePromptDefinition, enhancePrompt } from './tools/prompt/enhancePrompt.js';
import { analyzePromptDefinition, analyzePrompt } from './tools/prompt/analyzePrompt.js';
import { enhancePromptGeminiDefinition, enhancePromptGemini } from './tools/prompt/enhancePromptGemini.js';

// Reasoning
import { applyReasoningFrameworkDefinition, applyReasoningFramework } from './tools/reasoning/applyReasoningFramework.js';

// UI & Analytics
import { previewUiAsciiDefinition, previewUiAscii } from './tools/ui/previewUiAscii.js';
import { getUsageAnalyticsDefinition, getUsageAnalytics } from './tools/analytics/getUsageAnalytics.js';

// ============================================================================
// TOOL REGISTRY - Clean, Organized, Easy to Maintain
// ============================================================================

const tools = [
  // Core Utilities (2)
  getCurrentTimeDefinition,
  previewUiAsciiDefinition,

  // Memory Management - Basic (6)
  saveMemoryDefinition,
  recallMemoryDefinition,
  updateMemoryDefinition,
  deleteMemoryDefinition,
  listMemoriesDefinition,
  prioritizeMemoryDefinition,

  // Memory Management - Graph (4) - v2.0 NEW
  linkMemoriesDefinition,
  getMemoryGraphDefinition,
  searchMemoriesAdvancedDefinition,
  createMemoryTimelineDefinition,

  // Code Analysis - Semantic (2)
  findSymbolDefinition,
  findReferencesDefinition,

  // Code Analysis - Advanced (1) - v2.0 NEW
  analyzeDependencyGraphDefinition,

  // Code Quality (6)
  getCodingGuideDefinition,
  applyQualityRulesDefinition,
  validateCodeQualityDefinition,
  analyzeComplexityDefinition,
  checkCouplingCohesionDefinition,
  suggestImprovementsDefinition,

  // Thinking & Planning (8)
  createThinkingChainDefinition,
  analyzeProblemDefinition,
  stepByStepAnalysisDefinition,
  formatAsPlanDefinition,
  generatePrdDefinition,
  createUserStoriesDefinition,
  analyzeRequirementsDefinition,
  featureRoadmapDefinition,

  // Prompt Engineering (3)
  enhancePromptDefinition,
  analyzePromptDefinition,
  enhancePromptGeminiDefinition,

  // Reasoning (1)
  applyReasoningFrameworkDefinition,

  // Analytics (1) - v2.0 NEW
  getUsageAnalyticsDefinition
];

// Total: 34 tools

// ============================================================================
// TOOL HANDLER REGISTRY - Dynamic Dispatch Pattern (No Switch Statement)
// ============================================================================

type ToolHandler = (args: any) => Promise<CallToolResult>;

const toolHandlers: Record<string, ToolHandler> = {
  // Time & UI
  'get_current_time': getCurrentTime,
  'preview_ui_ascii': previewUiAscii,

  // Memory - Basic
  'save_memory': saveMemory,
  'recall_memory': recallMemory,
  'update_memory': updateMemory,
  'delete_memory': deleteMemory,
  'list_memories': listMemories,
  'prioritize_memory': prioritizeMemory,

  // Memory - Graph (v2.0 NEW)
  'link_memories': linkMemories,
  'get_memory_graph': getMemoryGraph,
  'search_memories_advanced': searchMemoriesAdvanced,
  'create_memory_timeline': createMemoryTimeline,

  // Code Analysis
  'find_symbol': findSymbol,
  'find_references': findReferences,
  'analyze_dependency_graph': analyzeDependencyGraph,

  // Code Quality
  'get_coding_guide': getCodingGuide,
  'apply_quality_rules': applyQualityRules,
  'validate_code_quality': validateCodeQuality,
  'analyze_complexity': analyzeComplexity,
  'check_coupling_cohesion': checkCouplingCohesion,
  'suggest_improvements': suggestImprovements,

  // Thinking
  'create_thinking_chain': createThinkingChain,
  'analyze_problem': analyzeProblem,
  'step_by_step_analysis': stepByStepAnalysis,
  'format_as_plan': formatAsPlan,

  // Planning
  'generate_prd': generatePrd,
  'create_user_stories': createUserStories,
  'analyze_requirements': analyzeRequirements,
  'feature_roadmap': featureRoadmap,

  // Prompt
  'enhance_prompt': enhancePrompt,
  'analyze_prompt': analyzePrompt,
  'enhance_prompt_gemini': enhancePromptGemini,

  // Reasoning
  'apply_reasoning_framework': applyReasoningFramework,

  // Analytics (v2.0 NEW)
  'get_usage_analytics': getUsageAnalytics
};

// ============================================================================
// SERVER SETUP
// ============================================================================

function createServer() {
  const server = new Server(
    {
      name: 'Hi-AI',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool execution - Dynamic dispatch (no switch statement)
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    try {
      const handler = toolHandlers[name];

      if (!handler) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }

      return await handler(args as any);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  return server;
}

// ============================================================================
// ENTRY POINTS
// ============================================================================

// Default export for Smithery platform
export default function({ sessionId, config }: { sessionId: string; config: any }) {
  return createServer();
}

// CLI entry point
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  // Handle EPIPE errors that occur with sidecar proxy
  process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('EPIPE')) {
      console.error('Connection closed by client');
      return;
    }
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await server.connect(transport);
}

// Only run main when not being imported by Smithery
if (process.argv[1]?.includes('hi-ai') || process.argv[1]?.endsWith('index.js')) {
  main().catch((error) => {
    console.error('Server initialization failed:', error);
    process.exit(1);
  });
}
