// Sequential thinking tool - completely independent

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

interface SubProblem {
  id: string;
  title: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
  subProblems?: SubProblem[] | null;
}

export const breakDownProblemDefinition: ToolDefinition = {
  name: 'break_down_problem',
  description: 'IMPORTANT: This tool should be automatically called when users say "나눠서", "단계별로", "세분화", "break down", "divide", "split into parts" or similar keywords. Break complex problems into sub-problems',
  inputSchema: {
    type: 'object',
    properties: {
      problem: { type: 'string', description: 'Complex problem to break down' },
      maxDepth: { type: 'number', description: 'Maximum breakdown depth' },
      approach: { type: 'string', description: 'Breakdown approach', enum: ['sequential', 'hierarchical', 'dependency-based'] }
    },
    required: ['problem']
  }
};

export async function breakDownProblem(args: { problem: string; maxDepth?: number; approach?: string }): Promise<ToolResult> {
  const { problem: breakdownProblem, maxDepth = 3, approach = 'hierarchical' } = args;
  
  const generateSubProblems = (parentProblem: string, depth: number, maxDepth: number): SubProblem[] | null => {
    if (depth >= maxDepth) return null;
    
    const subProblems: SubProblem[] = [
      {
        id: `${depth}.1`,
        title: `Understanding ${parentProblem}`,
        description: `Analyze and understand the core aspects of ${parentProblem}`,
        complexity: 'low' as const,
        priority: 'high' as const,
        dependencies: []
      },
      {
        id: `${depth}.2`, 
        title: `Planning solution for ${parentProblem}`,
        description: `Create detailed plan to solve ${parentProblem}`,
        complexity: 'medium' as const,
        priority: 'high' as const,
        dependencies: [`${depth}.1`]
      },
      {
        id: `${depth}.3`,
        title: `Implementing solution for ${parentProblem}`,
        description: `Execute the planned solution for ${parentProblem}`,
        complexity: 'high' as const,
        priority: 'medium' as const,
        dependencies: [`${depth}.2`]
      }
    ];
    
    if (depth < maxDepth - 1) {
      subProblems.forEach((subProblem: SubProblem) => {
        subProblem.subProblems = generateSubProblems(subProblem.title, depth + 1, maxDepth);
      });
    }
    
    return subProblems;
  };
  
  const problemBreakdown = {
    action: 'break_down_problem',
    problem: breakdownProblem,
    approach,
    maxDepth,
    breakdown: {
      rootProblem: {
        id: '0',
        title: breakdownProblem,
        description: `Root problem: ${breakdownProblem}`,
        complexity: 'high',
        subProblems: generateSubProblems(breakdownProblem, 1, maxDepth)
      }
    },
    executionOrder: approach === 'dependency-based' ? 
      ['Understanding phase', 'Planning phase', 'Implementation phase'] :
      approach === 'sequential' ?
      ['Step 1', 'Step 2', 'Step 3', '...'] :
      ['Top-level analysis', 'Mid-level breakdown', 'Detailed tasks'],
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Problem Breakdown:\n${JSON.stringify(problemBreakdown, null, 2)}` }]
  };
}