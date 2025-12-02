// Sequential thinking tool - completely independent

import { Project, ScriptKind } from "ts-morph";
import { ToolResult, ToolDefinition } from '../../types/tool.js';

const AST_PROJECT = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { allowJs: true, skipLibCheck: true }
});

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
  description: '나눠서|단계별로|세분화|break down|divide|split into parts - Break complex problems into sub-problems',
  inputSchema: {
    type: 'object',
    properties: {
      problem: { type: 'string', description: 'Complex problem to break down' },
      maxDepth: { type: 'number', description: 'Maximum breakdown depth' },
      approach: { type: 'string', description: 'Breakdown approach', enum: ['sequential', 'hierarchical', 'dependency-based'] }
    },
    required: ['problem']
  },
  annotations: {
    title: 'Break Down Problem',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function breakDownProblem(args: { problem: string; maxDepth?: number; approach?: string }): Promise<ToolResult> {
  const { problem: breakdownProblem, maxDepth = 3, approach = 'hierarchical' } = args;
  
  // 코드로 추정되는 입력이면 AST 기반 구조 분해 시도
  let codeStructureSubProblems: SubProblem[] | null = null;
  if (breakdownProblem.includes('function') || breakdownProblem.includes('class') || breakdownProblem.includes('=>')) {
    try {
      const sourceFile = AST_PROJECT.createSourceFile('temp.ts', breakdownProblem, {
        overwrite: true,
        scriptKind: ScriptKind.TS
      });
      const funcs = sourceFile.getFunctions();
      const classes = sourceFile.getClasses();
      const vars = sourceFile.getVariableDeclarations();
      codeStructureSubProblems = [];
      funcs.forEach((f, i) => {
        codeStructureSubProblems!.push({
          id: `codeFunc${i+1}`,
          title: `함수 분석: ${f.getName() || '익명함수'}`,
          description: f.getText().slice(0, 100) + (f.getText().length > 100 ? '...' : ''),
          complexity: 'medium',
          priority: 'high',
          dependencies: []
        });
      });
      classes.forEach((c, i) => {
        codeStructureSubProblems!.push({
          id: `codeClass${i+1}`,
          title: `클래스 분석: ${c.getName() || '익명클래스'}`,
          description: c.getText().slice(0, 100) + (c.getText().length > 100 ? '...' : ''),
          complexity: 'high',
          priority: 'high',
          dependencies: []
        });
      });
      vars.forEach((v, i) => {
        codeStructureSubProblems!.push({
          id: `codeVar${i+1}`,
          title: `변수 분석: ${v.getName()}`,
          description: v.getText().slice(0, 100) + (v.getText().length > 100 ? '...' : ''),
          complexity: 'low',
          priority: 'medium',
          dependencies: []
        });
      });
      if (codeStructureSubProblems.length === 0) codeStructureSubProblems = null;
    } catch (e) {
      codeStructureSubProblems = null;
    }
  }
  
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
        subProblems: codeStructureSubProblems || generateSubProblems(breakdownProblem, 1, maxDepth)
      }
    },
    executionOrder: approach === 'dependency-based' ? 
      ['Understanding phase', 'Planning phase', 'Implementation phase'] :
      approach === 'sequential' ?
      ['Step 1', 'Step 2', 'Step 3', '...'] :
      ['Top-level analysis', 'Mid-level breakdown', 'Detailed tasks'],
    status: 'success'
  };
  
  const formatSubProblems = (subs: SubProblem[] | null, indent = 0): string => {
    if (!subs) return '';
    return subs.map(s => `${'  '.repeat(indent)}- ${s.title} (${s.complexity}, ${s.priority})${s.subProblems ? '\n' + formatSubProblems(s.subProblems, indent + 1) : ''}`).join('\n');
  };

  return {
    content: [{ type: 'text', text: `Problem: ${breakdownProblem}\nApproach: ${approach}\nMax Depth: ${maxDepth}\n\nBreakdown:\n${formatSubProblems(problemBreakdown.breakdown.rootProblem.subProblems)}\n\nExecution: ${problemBreakdown.executionOrder.join(' → ')}` }]
  };
}