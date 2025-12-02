#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
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
import { breakDownProblemDefinition, breakDownProblem } from './tools/thinking/breakDownProblem.js';
import { thinkAloudProcessDefinition, thinkAloudProcess } from './tools/thinking/thinkAloudProcess.js';

// Memory Management (Basic)
import { saveMemoryDefinition, saveMemory } from './tools/memory/saveMemory.js';
import { recallMemoryDefinition, recallMemory } from './tools/memory/recallMemory.js';
import { listMemoriesDefinition, listMemories } from './tools/memory/listMemories.js';
import { deleteMemoryDefinition, deleteMemory } from './tools/memory/deleteMemory.js';
import { updateMemoryDefinition, updateMemory } from './tools/memory/updateMemory.js';
import { prioritizeMemoryDefinition, prioritizeMemory } from './tools/memory/prioritizeMemory.js';
import { searchMemoriesDefinition, searchMemoriesHandler } from './tools/memory/searchMemories.js';
import { autoSaveContextDefinition, autoSaveContext } from './tools/memory/autoSaveContext.js';
import { restoreSessionContextDefinition, restoreSessionContext } from './tools/memory/restoreSessionContext.js';
import { startSessionDefinition, startSession } from './tools/memory/startSession.js';

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

  // Memory Management - Basic (10)
  saveMemoryDefinition,
  recallMemoryDefinition,
  updateMemoryDefinition,
  deleteMemoryDefinition,
  listMemoriesDefinition,
  prioritizeMemoryDefinition,
  searchMemoriesDefinition,
  autoSaveContextDefinition,
  restoreSessionContextDefinition,
  startSessionDefinition,

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

  // Thinking & Planning (10)
  createThinkingChainDefinition,
  analyzeProblemDefinition,
  stepByStepAnalysisDefinition,
  formatAsPlanDefinition,
  breakDownProblemDefinition,
  thinkAloudProcessDefinition,
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

// Total: 40 tools

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
  'search_memories': searchMemoriesHandler,
  'auto_save_context': autoSaveContext,
  'restore_session_context': restoreSessionContext,
  'start_session': startSession,

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
  'break_down_problem': breakDownProblem,
  'think_aloud_process': thinkAloudProcess,

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

  // Prompts - predefined workflows
  const prompts = [
    {
      name: 'code-review',
      description: 'Comprehensive code review with quality analysis',
      arguments: [
        { name: 'code', description: 'Code to review', required: true },
        { name: 'language', description: 'Programming language', required: false }
      ]
    },
    {
      name: 'problem-solver',
      description: 'Step-by-step problem analysis and solution planning',
      arguments: [
        { name: 'problem', description: 'Problem description', required: true },
        { name: 'context', description: 'Additional context', required: false }
      ]
    },
    {
      name: 'project-kickoff',
      description: 'Start a new project with PRD, user stories, and roadmap',
      arguments: [
        { name: 'projectName', description: 'Name of the project', required: true },
        { name: 'vision', description: 'Project vision and goals', required: true }
      ]
    }
  ];

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'code-review':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please perform a comprehensive code review for the following code:\n\n${args?.code || ''}\n\nAnalyze for:\n1. Code quality and best practices\n2. Complexity and maintainability\n3. Potential improvements\n4. Security considerations`
              }
            }
          ]
        };
      case 'problem-solver':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need help solving this problem:\n\n${args?.problem || ''}\n\nContext: ${args?.context || 'None provided'}\n\nPlease:\n1. Break down the problem into sub-problems\n2. Analyze each component step-by-step\n3. Propose a structured solution plan`
              }
            }
          ]
        };
      case 'project-kickoff':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Let's kick off a new project:\n\nProject Name: ${args?.projectName || 'Unnamed Project'}\nVision: ${args?.vision || ''}\n\nPlease help me create:\n1. A Product Requirements Document (PRD)\n2. User stories with acceptance criteria\n3. A development roadmap`
              }
            }
          ]
        };
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
    }
  });

  // Resources - project information and guides
  const resources = [
    {
      uri: 'hi-ai://guides/quality-rules',
      name: 'Code Quality Rules',
      description: 'Best practices and quality rules for code development',
      mimeType: 'text/plain'
    },
    {
      uri: 'hi-ai://guides/naming-conventions',
      name: 'Naming Conventions',
      description: 'Naming conventions for variables, functions, and components',
      mimeType: 'text/plain'
    },
    {
      uri: 'hi-ai://info/capabilities',
      name: 'Hi-AI Capabilities',
      description: 'Overview of Hi-AI tools and features',
      mimeType: 'text/plain'
    }
  ];

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case 'hi-ai://guides/quality-rules':
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `# Code Quality Rules

## Complexity
- Max Cyclomatic Complexity: 10
- Max Cognitive Complexity: 15
- Max Function Lines: 20
- Max Nesting Depth: 3
- Max Parameters: 5

## Coupling
- Max Dependencies: 7
- Max Fan-Out: 5
- Prevent Circular Dependencies

## Maintainability
- No Magic Numbers
- Consistent Naming
- Proper Error Handling
- Type Safety`
          }]
        };
      case 'hi-ai://guides/naming-conventions':
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `# Naming Conventions

## Variables
- Use nouns: userList, userData

## Functions
- Use verb+noun: fetchData, updateUser

## Event Handlers
- Use handle prefix: handleClick, handleSubmit

## Booleans
- Use is/has/can prefix: isLoading, hasError, canEdit

## Constants
- Use UPPER_SNAKE_CASE: MAX_RETRY_COUNT, API_TIMEOUT

## Components
- Use PascalCase: UserProfile, HeaderSection

## Hooks
- Use use prefix: useUserData, useAuth`
          }]
        };
      case 'hi-ai://info/capabilities':
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `# Hi-AI Capabilities

## Tool Categories (40 tools)

### Time Utilities (1)
- get_current_time

### UI Preview (1)
- preview_ui_ascii

### Semantic Code Analysis (3)
- find_symbol, find_references, analyze_dependency_graph

### Sequential Thinking (6 tools)
- create_thinking_chain, analyze_problem
- step_by_step_analysis, format_as_plan
- break_down_problem, think_aloud_process

### Memory Management - Basic (10 tools)
- save_memory, recall_memory, list_memories
- delete_memory, update_memory, prioritize_memory
- search_memories, auto_save_context
- restore_session_context, start_session

### Memory Management - Graph (4 tools)
- link_memories, get_memory_graph
- search_memories_advanced, create_memory_timeline

### Code Quality (6 tools)
- get_coding_guide, apply_quality_rules
- validate_code_quality, analyze_complexity
- check_coupling_cohesion, suggest_improvements

### Project Planning (4 tools)
- generate_prd, create_user_stories
- analyze_requirements, feature_roadmap

### Prompt Enhancement (3 tools)
- enhance_prompt, analyze_prompt, enhance_prompt_gemini

### Reasoning (1)
- apply_reasoning_framework

### Analytics (1)
- get_usage_analytics`
          }]
        };
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    }
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
