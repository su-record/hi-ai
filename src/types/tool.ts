// Common MCP tool type definitions (v2.0)

export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  [key: string]: unknown;  // Allow additional properties for MCP compatibility
}

export interface ToolAnnotation {
  audience?: string[];
  title?: string;
  progress?: number;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  annotations?: ToolAnnotation;
}

// v2.0 - Memory Graph Types
export interface MemoryRelation {
  sourceKey: string;
  targetKey: string;
  relationType: string;
  strength: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface MemoryGraphNode {
  key: string;
  value: string;
  category: string;
  relations: MemoryRelation[];
}

export interface MemoryGraph {
  nodes: MemoryGraphNode[];
  edges: MemoryRelation[];
  clusters: string[][];
}

// v2.0 - Search Types
export type SearchStrategy = 'keyword' | 'graph_traversal' | 'temporal' | 'priority' | 'context_aware';

// v2.0 - Analytics Types
export interface ToolUsage {
  toolName: string;
  timestamp: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
}

export interface UsageStats {
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  topTools: Array<{ name: string; count: number }>;
  errorsByTool: Record<string, number>;
}
