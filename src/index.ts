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

// Import all tool definitions and handlers
import { getCurrentTimeDefinition, getCurrentTime } from './tools/time/getCurrentTime.js';

// Semantic code analysis tools (Serena-inspired)
import { findSymbolDefinition, findSymbol } from './tools/semantic/findSymbol.js';
import { findReferencesDefinition, findReferences } from './tools/semantic/findReferences.js';
import { createThinkingChainDefinition, createThinkingChain } from './tools/thinking/createThinkingChain.js';
import { analyzeProblemDefinition, analyzeProblem } from './tools/thinking/analyzeProblem.js';
import { stepByStepAnalysisDefinition, stepByStepAnalysis } from './tools/thinking/stepByStepAnalysis.js';
import { breakDownProblemDefinition, breakDownProblem } from './tools/thinking/breakDownProblem.js';
import { thinkAloudProcessDefinition, thinkAloudProcess } from './tools/thinking/thinkAloudProcess.js';
import { formatAsPlanDefinition, formatAsPlan } from './tools/thinking/formatAsPlan.js';
import { monitorConsoleLogsDefinition, monitorConsoleLogs } from './tools/browser/monitorConsoleLogs.js';
import { inspectNetworkRequestsDefinition, inspectNetworkRequests } from './tools/browser/inspectNetworkRequests.js';
import { saveMemoryDefinition, saveMemory } from './tools/memory/saveMemory.js';
import { recallMemoryDefinition, recallMemory } from './tools/memory/recallMemory.js';
import { listMemoriesDefinition, listMemories } from './tools/memory/listMemories.js';
import { deleteMemoryDefinition, deleteMemory } from './tools/memory/deleteMemory.js';
import { searchMemoriesDefinition, searchMemoriesHandler } from './tools/memory/searchMemories.js';
import { updateMemoryDefinition, updateMemory } from './tools/memory/updateMemory.js';
import { autoSaveContextDefinition, autoSaveContext } from './tools/memory/autoSaveContext.js';
import { restoreSessionContextDefinition, restoreSessionContext } from './tools/memory/restoreSessionContext.js';
import { prioritizeMemoryDefinition, prioritizeMemory } from './tools/memory/prioritizeMemory.js';
import { startSessionDefinition, startSession } from './tools/memory/startSession.js';
import { getCodingGuideDefinition, getCodingGuide } from './tools/convention/getCodingGuide.js';
import { applyQualityRulesDefinition, applyQualityRules } from './tools/convention/applyQualityRules.js';
import { validateCodeQualityDefinition, validateCodeQuality } from './tools/convention/validateCodeQuality.js';
import { analyzeComplexityDefinition, analyzeComplexity } from './tools/convention/analyzeComplexity.js';
import { checkCouplingCohesionDefinition, checkCouplingCohesion } from './tools/convention/checkCouplingCohesion.js';
import { suggestImprovementsDefinition, suggestImprovements } from './tools/convention/suggestImprovements.js';
import { generatePrdDefinition, generatePrd } from './tools/planning/generatePrd.js';
import { createUserStoriesDefinition, createUserStories } from './tools/planning/createUserStories.js';
import { analyzeRequirementsDefinition, analyzeRequirements } from './tools/planning/analyzeRequirements.js';
import { featureRoadmapDefinition, featureRoadmap } from './tools/planning/featureRoadmap.js';
import { enhancePromptDefinition, enhancePrompt } from './tools/prompt/enhancePrompt.js';
import { analyzePromptDefinition, analyzePrompt } from './tools/prompt/analyzePrompt.js';
import { previewUiAsciiDefinition, previewUiAscii } from './tools/ui/previewUiAscii.js';

// Collect all tool definitions
const tools = [
  // Time Utility Tools
  getCurrentTimeDefinition,
  
  // Semantic Code Analysis Tools (Serena-inspired)
  findSymbolDefinition,
  findReferencesDefinition,
  
  // Sequential Thinking Tools  
  createThinkingChainDefinition,
  analyzeProblemDefinition,
  stepByStepAnalysisDefinition,
  breakDownProblemDefinition,
  thinkAloudProcessDefinition,
  formatAsPlanDefinition,
  
  // Browser Development Tools
  monitorConsoleLogsDefinition,
  inspectNetworkRequestsDefinition,
  
  // Memory Management Tools
  saveMemoryDefinition,
  recallMemoryDefinition,
  listMemoriesDefinition,
  deleteMemoryDefinition,
  searchMemoriesDefinition,
  updateMemoryDefinition,
  autoSaveContextDefinition,
  restoreSessionContextDefinition,
  prioritizeMemoryDefinition,
  startSessionDefinition,
  
  // Convention Tools
  getCodingGuideDefinition,
  applyQualityRulesDefinition,
  validateCodeQualityDefinition,
  analyzeComplexityDefinition,
  checkCouplingCohesionDefinition,
  suggestImprovementsDefinition,
  
  // Planning Tools
  generatePrdDefinition,
  createUserStoriesDefinition,
  analyzeRequirementsDefinition,
  featureRoadmapDefinition,
  
  // Prompt Enhancement Tools
  enhancePromptDefinition,
  analyzePromptDefinition,

  // UI Preview Tools
  previewUiAsciiDefinition
];

function createServer() {
  const server = new Server(
    {
      name: 'Hi-AI',
      version: '1.3.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request, extra): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        // Time Utility Tools
        case 'get_current_time':
          return await getCurrentTime(args as any) as CallToolResult;
          
        // Semantic Code Analysis Tools
        case 'find_symbol':
          return await findSymbol(args as any) as CallToolResult;
        case 'find_references':
          return await findReferences(args as any) as CallToolResult;
          
        // Sequential Thinking Tools
        case 'create_thinking_chain':
          return await createThinkingChain(args as any) as CallToolResult;
        case 'analyze_problem':
          return await analyzeProblem(args as any) as CallToolResult;
        case 'step_by_step_analysis':
          return await stepByStepAnalysis(args as any) as CallToolResult;
        case 'break_down_problem':
          return await breakDownProblem(args as any) as CallToolResult;
        case 'think_aloud_process':
          return await thinkAloudProcess(args as any) as CallToolResult;
        case 'format_as_plan':
          return await formatAsPlan(args as any) as CallToolResult;
          
        // Browser Development Tools
        case 'monitor_console_logs':
          return await monitorConsoleLogs(args as any) as CallToolResult;
        case 'inspect_network_requests':
          return await inspectNetworkRequests(args as any) as CallToolResult;
          
        // Memory Management Tools
        case 'save_memory':
          return await saveMemory(args as any) as CallToolResult;
        case 'recall_memory':
          return await recallMemory(args as any) as CallToolResult;
        case 'list_memories':
          return await listMemories(args as any) as CallToolResult;
        case 'delete_memory':
          return await deleteMemory(args as any) as CallToolResult;
        case 'search_memories':
          return await searchMemoriesHandler(args as any) as CallToolResult;
        case 'update_memory':
          return await updateMemory(args as any) as CallToolResult;
        case 'auto_save_context':
          return await autoSaveContext(args as any) as CallToolResult;
        case 'restore_session_context':
          return await restoreSessionContext(args as any) as CallToolResult;
        case 'prioritize_memory':
          return await prioritizeMemory(args as any) as CallToolResult;
        case 'start_session':
          return await startSession(args as any) as CallToolResult;
          
        // Convention Tools
        case 'get_coding_guide':
          return await getCodingGuide(args as any) as CallToolResult;
        case 'apply_quality_rules':
          return await applyQualityRules(args as any) as CallToolResult;
        case 'validate_code_quality':
          return await validateCodeQuality(args as any) as CallToolResult;
        case 'analyze_complexity':
          return await analyzeComplexity(args as any) as CallToolResult;
        case 'check_coupling_cohesion':
          return await checkCouplingCohesion(args as any) as CallToolResult;
        case 'suggest_improvements':
          return await suggestImprovements(args as any) as CallToolResult;
          
        // Planning Tools
        case 'generate_prd':
          return await generatePrd(args as any) as CallToolResult;
        case 'create_user_stories':
          return await createUserStories(args as any) as CallToolResult;
        case 'analyze_requirements':
          return await analyzeRequirements(args as any) as CallToolResult;
        case 'feature_roadmap':
          return await featureRoadmap(args as any) as CallToolResult;
          
        // Prompt Enhancement Tools
        case 'enhance_prompt':
          return await enhancePrompt(args as any) as CallToolResult;
        case 'analyze_prompt':
          return await analyzePrompt(args as any) as CallToolResult;

        // UI Preview Tools
        case 'preview_ui_ascii':
          return await previewUiAscii(args as any) as CallToolResult;

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return server;
}

// Default export for Smithery platform
export default function({ sessionId, config }: { sessionId: string; config: any }) {
  // Return the configured server instance
  return createServer();
}

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
      // Gracefully handle EPIPE errors
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