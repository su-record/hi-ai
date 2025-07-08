// Convention management tool - completely independent

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
  description: 'IMPORTANT: This tool should be automatically called when users mention "복잡도", "복잡한지", "complexity", "how complex", "is it complex", "difficulty level" or similar keywords. Analyze code complexity',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to analyze' },
      metrics: { type: 'string', description: 'Metrics to calculate', enum: ['cyclomatic', 'cognitive', 'halstead', 'all'] }
    },
    required: ['code']
  }
};

export async function analyzeComplexity(args: { code: string; metrics?: string }): Promise<ToolResult> {
  const { code: complexityCode, metrics: complexityMetrics = 'all' } = args;
  
  const complexityAnalysis = {
    action: 'analyze_complexity',
    metrics: complexityMetrics,
    results: {} as any,
    overallScore: 0,
    issues: [] as string[],
    recommendations: [] as string[],
    status: 'pending' as string
  };
  
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
    // Cognitive complexity calculation (simplified version)
    let cognitiveComplexityScore = 0;
    const lines = complexityCode.split('\n');
    let nestingLevel = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Increment nesting for control structures
      if (trimmedLine.includes('if') || trimmedLine.includes('for') || trimmedLine.includes('while')) {
        cognitiveComplexityScore += 1 + nestingLevel;
      }
      
      // Increment for catch blocks
      if (trimmedLine.includes('catch')) {
        cognitiveComplexityScore += 1 + nestingLevel;
      }
      
      // Increment for switch statements
      if (trimmedLine.includes('switch')) {
        cognitiveComplexityScore += 1 + nestingLevel;
      }
      
      // Update nesting level
      const braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      nestingLevel = Math.max(0, nestingLevel + braceCount);
    }
    
    complexityAnalysis.results.cognitiveComplexity = {
      value: cognitiveComplexityScore,
      threshold: CODE_QUALITY_METRICS.COMPLEXITY.maxCognitiveComplexity,
      status: cognitiveComplexityScore <= CODE_QUALITY_METRICS.COMPLEXITY.maxCognitiveComplexity ? 'pass' : 'fail',
      description: 'How difficult the code is to understand'
    };
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
  complexityAnalysis.recommendations = issues.length > 0 ? [
    'Consider breaking down complex functions into smaller ones',
    'Reduce nesting depth using early returns or guard clauses',
    'Extract complex logic into separate functions',
    'Use more descriptive variable names',
    'Add comments for complex logic'
  ] : ['Code complexity is within acceptable ranges'];
  
  complexityAnalysis.status = 'success';
  
  return {
    content: [{ type: 'text', text: `Complexity Analysis:\n${JSON.stringify(complexityAnalysis, null, 2)}` }]
  };
}