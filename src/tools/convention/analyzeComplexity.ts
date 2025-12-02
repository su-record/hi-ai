// Convention management tool - completely independent

import { Project, ScriptKind } from "ts-morph";
import { PythonParser } from '../../lib/PythonParser.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

// Reusable in-memory project to avoid re-parsing standard lib every call
const AST_PROJECT = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { allowJs: true, skipLibCheck: true }
});

// Enhanced Software Engineering Metrics
const CODE_QUALITY_METRICS = {
  COMPLEXITY: {
    maxCyclomaticComplexity: 10,
    maxCognitiveComplexity: 15,
    maxFunctionLines: 20,
    maxNestingDepth: 3,
    maxParameters: 5
  },
  COUPLING: {
    maxDependencies: 7,
    maxFanOut: 5,
    preventCircularDeps: true
  },
  COHESION: {
    singleResponsibility: true,
    relatedFunctionsOnly: true
  },
  MAINTAINABILITY: {
    noMagicNumbers: true,
    consistentNaming: true,
    properErrorHandling: true,
    typesSafety: true
  },
  PERFORMANCE: {
    memoizeExpensiveCalc: true,
    lazyLoading: true,
    batchOperations: true
  }
};

export const analyzeComplexityDefinition: ToolDefinition = {
  name: 'analyze_complexity',
  description: '복잡도|복잡한지|complexity|how complex|난이도 - Analyze code complexity',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to analyze' },
      metrics: { type: 'string', description: 'Metrics to calculate', enum: ['cyclomatic', 'cognitive', 'halstead', 'all'] }
    },
    required: ['code']
  },
  annotations: {
    title: 'Analyze Complexity',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

/**
 * Calculate cognitive complexity (how hard code is to understand)
 */
function calculateCognitiveComplexity(code: string) {
  const CONTROL_STRUCTURES = ['if', 'for', 'while'];
  let cognitiveScore = 0;
  const lines = code.split('\n');
  let nestingLevel = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Increment for control structures
    if (CONTROL_STRUCTURES.some(keyword => trimmed.includes(keyword))) {
      cognitiveScore += 1 + nestingLevel;
    }

    // Increment for catch/switch
    if (trimmed.includes('catch') || trimmed.includes('switch')) {
      cognitiveScore += 1 + nestingLevel;
    }

    // Update nesting level
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    nestingLevel = Math.max(0, nestingLevel + openBraces - closeBraces);
  }

  const threshold = CODE_QUALITY_METRICS.COMPLEXITY.maxCognitiveComplexity;
  return {
    value: cognitiveScore,
    threshold,
    status: cognitiveScore <= threshold ? 'pass' : 'fail',
    description: 'How difficult the code is to understand'
  };
}

/**
 * Calculate AST-based cyclomatic complexity
 */
function calculateAstComplexity(code: string) {
  const CONTROL_FLOW_NODES = [
    'IfStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement',
    'WhileStatement', 'CaseClause', 'ConditionalExpression',
    'DoStatement', 'CatchClause', 'BinaryExpression'
  ];

  let astCyclomatic = 1;
  try {
    const sourceFile = AST_PROJECT.createSourceFile('temp.ts', code, {
      overwrite: true,
      scriptKind: ScriptKind.TS
    });

    sourceFile.forEachDescendant((node) => {
      if (CONTROL_FLOW_NODES.includes(node.getKindName())) {
        astCyclomatic++;
      }
    });

    const threshold = CODE_QUALITY_METRICS.COMPLEXITY.maxCyclomaticComplexity;
    return {
      value: astCyclomatic,
      threshold,
      status: astCyclomatic <= threshold ? 'pass' : 'fail',
      description: 'AST 기반 분기/조건문 수를 통한 cyclomatic complexity'
    };
  } catch (e) {
    return {
      value: null,
      status: 'error',
      description: 'AST 분석 실패: ' + (e instanceof Error ? e.message : String(e))
    };
  }
}

/**
 * Analyze Python code complexity
 */
async function analyzePythonComplexity(code: string): Promise<ToolResult> {
  try {
    const pythonComplexity = await PythonParser.analyzeComplexity(code);
    const totalComplexity = pythonComplexity.cyclomaticComplexity;
    const issues: string[] = [];

    const MAX_COMPLEXITY = 10;
    if (totalComplexity > MAX_COMPLEXITY) {
      issues.push('High complexity');
    }

    pythonComplexity.functions.forEach(f => {
      if (f.complexity > MAX_COMPLEXITY) {
        issues.push(`Function ${f.name}: complexity ${f.complexity}`);
      }
    });

    const issuesText = issues.length ? `\nIssues: ${issues.join(', ')}` : '';
    return {
      content: [{
        type: 'text',
        text: `Python Complexity: ${totalComplexity}\nFunctions: ${pythonComplexity.functions.length}\nClasses: ${pythonComplexity.classes.length}${issuesText}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Python analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

export async function analyzeComplexity(args: { code: string; metrics?: string }): Promise<ToolResult> {
  const { code: complexityCode, metrics: complexityMetrics = 'all' } = args;

  // Check if this is Python code
  if (PythonParser.isPythonCode(complexityCode)) {
    return analyzePythonComplexity(complexityCode);
  }

  const complexityAnalysis = {
    action: 'analyze_complexity',
    metrics: complexityMetrics,
    results: {} as any,
    overallScore: 0,
    issues: [] as string[],
    recommendations: [] as string[],
    status: 'pending' as string
  };

  // AST 기반 cyclomatic complexity 분석
  complexityAnalysis.results.astCyclomaticComplexity = calculateAstComplexity(complexityCode);
  
  if (complexityMetrics === 'cyclomatic' || complexityMetrics === 'all') {
    const cyclomaticComplexityScore = (complexityCode.match(/\bif\b|\bfor\b|\bwhile\b|\bcase\b|\b&&\b|\b\|\|\b/g) || []).length + 1;
    complexityAnalysis.results.cyclomaticComplexity = {
      value: cyclomaticComplexityScore,
      threshold: CODE_QUALITY_METRICS.COMPLEXITY.maxCyclomaticComplexity,
      status: cyclomaticComplexityScore <= CODE_QUALITY_METRICS.COMPLEXITY.maxCyclomaticComplexity ? 'pass' : 'fail',
      description: 'Number of linearly independent paths through the code'
    };
  }
  
  if (complexityMetrics === 'cognitive' || complexityMetrics === 'all') {
    complexityAnalysis.results.cognitiveComplexity = calculateCognitiveComplexity(complexityCode);
  }
  
  if (complexityMetrics === 'halstead' || complexityMetrics === 'all') {
    // Halstead metrics calculation (simplified version)
    const operators = (complexityCode.match(/[+\-*/=<>!&|%^~?:]/g) || []).length;
    const operands = (complexityCode.match(/\b[a-zA-Z_]\w*\b/g) || []).length;
    const uniqueOperators = new Set(complexityCode.match(/[+\-*/=<>!&|%^~?:]/g) || []).size;
    const uniqueOperands = new Set(complexityCode.match(/\b[a-zA-Z_]\w*\b/g) || []).size;
    
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = operators + operands;
    const calculatedLength = vocabulary > 0 ? uniqueOperators * Math.log2(uniqueOperators) + uniqueOperands * Math.log2(uniqueOperands) : 0;
    const volume = length * Math.log2(vocabulary);
    const difficulty = vocabulary > 0 ? (uniqueOperators / 2) * (operands / uniqueOperands) : 0;
    const effort = difficulty * volume;
    
    complexityAnalysis.results.halsteadMetrics = {
      vocabulary: vocabulary,
      length: length,
      calculatedLength: Math.round(calculatedLength),
      volume: Math.round(volume),
      difficulty: Math.round(difficulty * 100) / 100,
      effort: Math.round(effort),
      timeToProgram: Math.round(effort / 18), // Halstead's formula: effort / 18 seconds
      bugsDelivered: Math.round(volume / 3000 * 100) / 100, // Halstead's formula: volume / 3000
      description: 'Software science metrics measuring program complexity'
    };
  }
  
  // Additional complexity metrics
  if (complexityMetrics === 'all') {
    const lines = complexityCode.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0).length;
    const comments = (complexityCode.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length;
    const functions = (complexityCode.match(/function\s+\w+|\w+\s*=\s*\(/g) || []).length;
    const classes = (complexityCode.match(/class\s+\w+/g) || []).length;
    
    complexityAnalysis.results.additionalMetrics = {
      linesOfCode: nonEmptyLines,
      comments: comments,
      commentRatio: nonEmptyLines > 0 ? Math.round((comments / nonEmptyLines) * 100) / 100 : 0,
      functions: functions,
      classes: classes,
      averageFunctionLength: functions > 0 ? Math.round(nonEmptyLines / functions) : 0
    };
  }
  
  // Overall assessment
  const issues = [];
  let overallScore = 100;
  
  if (complexityAnalysis.results.cyclomaticComplexity && complexityAnalysis.results.cyclomaticComplexity.status === 'fail') {
    issues.push('High cyclomatic complexity detected');
    overallScore -= 20;
  }
  
  if (complexityAnalysis.results.cognitiveComplexity && complexityAnalysis.results.cognitiveComplexity.status === 'fail') {
    issues.push('High cognitive complexity detected');
    overallScore -= 25;
  }
  
  if (complexityAnalysis.results.halsteadMetrics && complexityAnalysis.results.halsteadMetrics.difficulty > 10) {
    issues.push('High Halstead difficulty detected');
    overallScore -= 15;
  }
  
  complexityAnalysis.overallScore = Math.max(0, overallScore);
  complexityAnalysis.issues = issues;

  return {
    content: [{
      type: 'text',
      text: `Complexity: ${complexityAnalysis.results.astCyclomaticComplexity?.value ?? 'N/A'}\nScore: ${complexityAnalysis.overallScore}${issues.length ? '\nIssues: ' + issues.join(', ') : ''}`
    }]
  };
}