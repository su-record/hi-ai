// Convention management tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

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

export const checkCouplingCohesionDefinition: ToolDefinition = {
  name: 'check_coupling_cohesion',
  description: '결합도|응집도|coupling|cohesion|dependencies check|module structure - Check coupling and cohesion',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to analyze' },
      type: { type: 'string', description: 'Code type', enum: ['class', 'module', 'function', 'component'] },
      checkDependencies: { type: 'boolean', description: 'Analyze dependencies' }
    },
    required: ['code']
  },
  annotations: {
    title: 'Check Coupling & Cohesion',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

import { Project, ScriptKind, SyntaxKind, CallExpression } from "ts-morph";
import * as ts from "typescript";

const AST_PROJECT = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { allowJs: true, skipLibCheck: true }
});

export async function checkCouplingCohesion(args: { code: string; type?: string; checkDependencies?: boolean }): Promise<ToolResult> {
  const { code: couplingCode, type: couplingType = 'function', checkDependencies = false } = args;
  
  const couplingAnalysis = {
    action: 'check_coupling_cohesion',
    type: couplingType,
    checkDependencies,
    results: {} as any,
    overallScore: 0,
    issues: [] as string[],
    recommendations: [] as string[],
    status: 'pending' as string
  };

  // AST 기반 의존성/구조 분석
  try {
    const sourceFile = AST_PROJECT.createSourceFile('temp.ts', couplingCode, {
      overwrite: true,
      scriptKind: ScriptKind.TS
    });
    // Import/Require 분석
    const importDecls = sourceFile.getImportDeclarations();
    const requireCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call: CallExpression) => call.getExpression().getText() === 'require');
    // 클래스/함수/모듈 구조 분석
    const classDecls = sourceFile.getClasses();
    const funcDecls = sourceFile.getFunctions();
    const exportDecls = sourceFile.getExportDeclarations();
    couplingAnalysis.results.ast = {
      importCount: importDecls.length,
      requireCount: requireCalls.length,
      classCount: classDecls.length,
      functionCount: funcDecls.length,
      exportCount: exportDecls.length,
      importModules: importDecls.map(d => d.getModuleSpecifierValue()),
      exportedNames: exportDecls.map(d => d.getNamedExports().map(e => e.getName()))
    };
  } catch (e) {
    couplingAnalysis.results.ast = {
      error: 'AST 분석 실패: ' + (e instanceof Error ? e.message : String(e))
    };
  }
  
  // Dependency analysis (Coupling)
  const imports = (couplingCode.match(/import\s+.*?\s+from\s+['"](.*?)['"]/g) || []).length;
  const requires = (couplingCode.match(/require\s*\(\s*['"](.*?)['"]\s*\)/g) || []).length;
  const totalDependencies = imports + requires;
  
  // External dependencies
  const externalDeps = (couplingCode.match(/import\s+.*?\s+from\s+['"](?!\.)(.*?)['"]/g) || []).length;
  const internalDeps = totalDependencies - externalDeps;
  
  // Function calls (fan-out)
  const functionCalls = (couplingCode.match(/\w+\s*\(/g) || []).length;
  const uniqueFunctionCalls = new Set((couplingCode.match(/\w+\s*\(/g) || []).map(call => call.replace(/\s*\(/, ''))).size;
  
  couplingAnalysis.results.coupling = {
    totalDependencies: totalDependencies,
    externalDependencies: externalDeps,
    internalDependencies: internalDeps,
    functionCalls: functionCalls,
    uniqueFunctionCalls: uniqueFunctionCalls,
    threshold: CODE_QUALITY_METRICS.COUPLING.maxDependencies,
    status: totalDependencies <= CODE_QUALITY_METRICS.COUPLING.maxDependencies ? 'pass' : 'fail',
    fanOut: uniqueFunctionCalls,
    fanOutStatus: uniqueFunctionCalls <= CODE_QUALITY_METRICS.COUPLING.maxFanOut ? 'pass' : 'fail'
  };
  
  // Cohesion analysis
  let cohesionScore = 0;
  let cohesionLevel = 'low';
  
  if (couplingType === 'class') {
    // Class cohesion: methods using same data
    const methods = (couplingCode.match(/\w+\s*\([^)]*\)\s*\{/g) || []).length;
    const properties = (couplingCode.match(/this\.\w+/g) || []).length;
    const uniqueProperties = new Set((couplingCode.match(/this\.(\w+)/g) || []).map(prop => prop.replace('this.', ''))).size;
    
    // LCOM (Lack of Cohesion in Methods) - simplified calculation
    const propertyUsage = methods > 0 ? uniqueProperties / methods : 0;
    cohesionScore = propertyUsage;
    
    couplingAnalysis.results.cohesion = {
      type: 'class',
      methods: methods,
      properties: uniqueProperties,
      propertyUsageRatio: Math.round(propertyUsage * 100) / 100,
      score: cohesionScore,
      level: cohesionScore > 0.7 ? 'high' : cohesionScore > 0.4 ? 'medium' : 'low',
      status: cohesionScore > 0.4 ? 'pass' : 'fail'
    };
  } else if (couplingType === 'module') {
    // Module cohesion: related functions and exports
    const functions = (couplingCode.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const exports = (couplingCode.match(/export\s+/g) || []).length;
    const variables = (couplingCode.match(/(?:const|let|var)\s+\w+/g) || []).length;
    
    // Functional cohesion: ratio of related functions
    const cohesionRatio = functions > 0 ? exports / functions : 0;
    cohesionScore = cohesionRatio;
    
    couplingAnalysis.results.cohesion = {
      type: 'module',
      functions: functions,
      exports: exports,
      variables: variables,
      cohesionRatio: Math.round(cohesionRatio * 100) / 100,
      score: cohesionScore,
      level: cohesionScore > 0.6 ? 'high' : cohesionScore > 0.3 ? 'medium' : 'low',
      status: cohesionScore > 0.3 ? 'pass' : 'fail'
    };
  } else if (couplingType === 'function') {
    // Function cohesion: single responsibility principle
    const statements = (couplingCode.match(/;/g) || []).length;
    const returns = (couplingCode.match(/\breturn\b/g) || []).length;
    const variables = (couplingCode.match(/(?:const|let|var)\s+\w+/g) || []).length;
    
    // Sequential cohesion: operations flow in sequence
    const lines = couplingCode.split('\n').filter(line => line.trim().length > 0).length;
    const complexityIndicators = (couplingCode.match(/\bif\b|\bfor\b|\bwhile\b|\bswitch\b/g) || []).length;
    
    cohesionScore = lines > 0 ? 1 - (complexityIndicators / lines) : 0;
    
    couplingAnalysis.results.cohesion = {
      type: 'function',
      statements: statements,
      returns: returns,
      variables: variables,
      lines: lines,
      complexityIndicators: complexityIndicators,
      score: Math.round(cohesionScore * 100) / 100,
      level: cohesionScore > 0.7 ? 'high' : cohesionScore > 0.4 ? 'medium' : 'low',
      status: cohesionScore > 0.4 ? 'pass' : 'fail'
    };
  } else if (couplingType === 'component') {
    // React component cohesion: props and state usage
    const props = (couplingCode.match(/props\.\w+/g) || []).length;
    const state = (couplingCode.match(/useState|useReducer/g) || []).length;
    const effects = (couplingCode.match(/useEffect/g) || []).length;
    const hooks = (couplingCode.match(/use\w+/g) || []).length;
    
    // Component cohesion: how well props, state, and effects are related
    const totalElements = props + state + effects;
    const cohesionRatio = totalElements > 0 ? hooks / totalElements : 0;
    cohesionScore = Math.min(1, cohesionRatio);
    
    couplingAnalysis.results.cohesion = {
      type: 'component',
      props: props,
      state: state,
      effects: effects,
      hooks: hooks,
      cohesionRatio: Math.round(cohesionRatio * 100) / 100,
      score: Math.round(cohesionScore * 100) / 100,
      level: cohesionScore > 0.6 ? 'high' : cohesionScore > 0.3 ? 'medium' : 'low',
      status: cohesionScore > 0.3 ? 'pass' : 'fail'
    };
  }
  
  // Overall assessment
  const issues = [];
  let overallScore = 100;
  
  if (couplingAnalysis.results.coupling.status === 'fail') {
    issues.push('High coupling detected - too many dependencies');
    overallScore -= 30;
  }
  
  if (couplingAnalysis.results.coupling.fanOutStatus === 'fail') {
    issues.push('High fan-out detected - too many function calls');
    overallScore -= 20;
  }
  
  if (couplingAnalysis.results.cohesion.status === 'fail') {
    issues.push('Low cohesion detected - poor single responsibility');
    overallScore -= 25;
  }
  
  couplingAnalysis.overallScore = Math.max(0, overallScore);
  couplingAnalysis.issues = issues;
  couplingAnalysis.recommendations = [];
  
  if (couplingAnalysis.results.coupling.status === 'fail') {
    couplingAnalysis.recommendations.push('Reduce dependencies by using dependency injection');
    couplingAnalysis.recommendations.push('Consider using interfaces to abstract dependencies');
  }
  
  if (couplingAnalysis.results.cohesion.status === 'fail') {
    couplingAnalysis.recommendations.push('Ensure single responsibility principle');
    couplingAnalysis.recommendations.push('Group related functionality together');
    couplingAnalysis.recommendations.push('Extract unrelated code into separate modules');
  }
  
  if (couplingAnalysis.recommendations.length === 0) {
    couplingAnalysis.recommendations.push('Coupling and cohesion are within acceptable ranges');
  }
  
  couplingAnalysis.status = 'success';
  
  return {
    content: [{ type: 'text', text: `Type: ${couplingType}\nScore: ${couplingAnalysis.overallScore}/100\n\nCoupling: ${couplingAnalysis.results.coupling.totalDependencies} deps (${couplingAnalysis.results.coupling.status}) | Fan-out: ${couplingAnalysis.results.coupling.fanOut} (${couplingAnalysis.results.coupling.fanOutStatus})\nCohesion: ${couplingAnalysis.results.cohesion.score} (${couplingAnalysis.results.cohesion.level}, ${couplingAnalysis.results.cohesion.status})\n\nIssues (${couplingAnalysis.issues.length}):\n${couplingAnalysis.issues.map(i => `- ${i}`).join('\n')}\n\nRecommendations:\n${couplingAnalysis.recommendations.map(r => `- ${r}`).join('\n')}` }]
  };
}