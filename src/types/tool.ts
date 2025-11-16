// Common MCP tool type definitions (v1.3)

export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface ToolAnnotation {
  audience?: string[];
  title?: string;
  progress?: number;
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
