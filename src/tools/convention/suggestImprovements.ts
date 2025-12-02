// Convention management tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const suggestImprovementsDefinition: ToolDefinition = {
  name: 'suggest_improvements',
  description: '개선|더 좋게|리팩토링|improve|make better|refactor|optimize|enhance code - Suggest improvements',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to analyze' },
      focus: { type: 'string', description: 'Focus area', enum: ['performance', 'readability', 'maintainability', 'accessibility', 'type-safety'] },
      priority: { type: 'string', description: 'Priority level', enum: ['critical', 'high', 'medium', 'low'] }
    },
    required: ['code']
  },
  annotations: {
    title: 'Suggest Improvements',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function suggestImprovements(args: { code: string; focus?: string; priority?: string }): Promise<ToolResult> {
  const { code, focus = 'maintainability', priority = 'medium' } = args;
  
  const suggestions = [];
  const codeLines = code.split('\n');
  const codeLength = codeLines.length;
  
  // Performance improvements
  if (focus === 'performance' || focus === 'all') {
    // Check for inefficient loops
    if (code.includes('for') && code.includes('length')) {
      suggestions.push({
        category: 'performance',
        priority: 'high',
        issue: 'Potential inefficient loop accessing .length property',
        suggestion: 'Cache array length in a variable before the loop',
        example: 'const len = array.length; for (let i = 0; i < len; i++)'
      });
    }
    
    // Check for React performance issues
    if (code.includes('React') || code.includes('jsx') || code.includes('tsx')) {
      if (!code.includes('memo') && !code.includes('useMemo') && !code.includes('useCallback')) {
        suggestions.push({
          category: 'performance',
          priority: 'medium',
          issue: 'Missing React performance optimizations',
          suggestion: 'Consider using React.memo, useMemo, or useCallback',
          example: 'const Component = React.memo(() => { ... })'
        });
      }
      
      if (code.includes('map') && code.includes('return')) {
        suggestions.push({
          category: 'performance',
          priority: 'medium',
          issue: 'Ensure unique keys in map functions',
          suggestion: 'Use unique and stable keys for list items',
          example: 'items.map(item => <div key={item.id}>{item.name}</div>)'
        });
      }
    }
    
    // Check for expensive operations
    if (code.includes('JSON.parse') || code.includes('JSON.stringify')) {
      suggestions.push({
        category: 'performance',
        priority: 'medium',
        issue: 'JSON operations can be expensive',
        suggestion: 'Consider memoizing JSON operations or using alternatives',
        example: 'const memoizedParse = useMemo(() => JSON.parse(data), [data])'
      });
    }
  }
  
  // Readability improvements
  if (focus === 'readability' || focus === 'all') {
    // Check for long functions
    if (codeLength > 20) {
      suggestions.push({
        category: 'readability',
        priority: 'high',
        issue: `Function is too long (${codeLength} lines)`,
        suggestion: 'Break down into smaller, focused functions',
        example: 'Extract logical groups into separate functions'
      });
    }
    
    // Check for deep nesting
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of codeLines) {
      const braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      currentNesting += braceCount;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    
    if (maxNesting > 3) {
      suggestions.push({
        category: 'readability',
        priority: 'high',
        issue: `Deep nesting detected (${maxNesting} levels)`,
        suggestion: 'Use early returns or guard clauses to reduce nesting',
        example: 'if (!condition) return; // instead of wrapping in else'
      });
    }
    
    // Check for magic numbers
    const magicNumbers = code.match(/\b\d{2,}\b/g) || [];
    if (magicNumbers.length > 0) {
      suggestions.push({
        category: 'readability',
        priority: 'medium',
        issue: 'Magic numbers found in code',
        suggestion: 'Extract numbers into named constants',
        example: 'const MAX_RETRY_COUNT = 3; // instead of using 3 directly'
      });
    }
    
    // Check for unclear variable names
    const shortVars = code.match(/\b[a-z]\b/g) || [];
    if (shortVars.length > 2) {
      suggestions.push({
        category: 'readability',
        priority: 'medium',
        issue: 'Single letter variable names detected',
        suggestion: 'Use descriptive variable names',
        example: 'const userIndex = 0; // instead of i = 0'
      });
    }
  }
  
  // Maintainability improvements
  if (focus === 'maintainability' || focus === 'all') {
    // Check for error handling
    const hasAsyncCode = code.includes('async') || code.includes('await') || code.includes('Promise');
    const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('throw');
    
    if (hasAsyncCode && !hasErrorHandling) {
      suggestions.push({
        category: 'maintainability',
        priority: 'high',
        issue: 'Async code without error handling',
        suggestion: 'Add try-catch blocks for async operations',
        example: 'try { await asyncOperation(); } catch (error) { handleError(error); }'
      });
    }
    
    // Check for code duplication
    const lines = codeLines.map(line => line.trim()).filter(line => line.length > 5);
    const duplicateLines = lines.filter((line, index) => lines.indexOf(line) !== index);
    if (duplicateLines.length > 0) {
      suggestions.push({
        category: 'maintainability',
        priority: 'medium',
        issue: 'Potential code duplication detected',
        suggestion: 'Extract common code into reusable functions',
        example: 'Create utility functions for repeated logic'
      });
    }
    
    // Check for comments
    const commentLines = code.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || [];
    const commentRatio = commentLines.length / codeLines.length;
    if (commentRatio < 0.1 && codeLength > 10) {
      suggestions.push({
        category: 'maintainability',
        priority: 'low',
        issue: 'Low comment-to-code ratio',
        suggestion: 'Add comments explaining complex logic',
        example: '// Validate user input before processing'
      });
    }
  }
  
  // Type safety improvements
  if (focus === 'type-safety' || focus === 'all') {
    // Check for any types
    if (code.includes('any')) {
      suggestions.push({
        category: 'type-safety',
        priority: 'high',
        issue: 'Using "any" type reduces type safety',
        suggestion: 'Use specific types or interfaces',
        example: 'interface User { id: string; name: string; }'
      });
    }
    
    // Check for loose equality
    if (code.includes('== ') || code.includes('!= ')) {
      suggestions.push({
        category: 'type-safety',
        priority: 'medium',
        issue: 'Loose equality operators found',
        suggestion: 'Use strict equality operators',
        example: 'Use === and !== instead of == and !='
      });
    }
    
    // Check for missing return types
    const functions = code.match(/function\s+\w+\([^)]*\)/g) || [];
    const functionsWithReturnType = code.match(/function\s+\w+\([^)]*\):\s*\w+/g) || [];
    if (functions.length > functionsWithReturnType.length) {
      suggestions.push({
        category: 'type-safety',
        priority: 'medium',
        issue: 'Functions missing explicit return types',
        suggestion: 'Add return type annotations',
        example: 'function getName(): string { return "name"; }'
      });
    }
  }
  
  // Accessibility improvements
  if (focus === 'accessibility' || focus === 'all') {
    // Check for missing alt text
    if (code.includes('<img') && !code.includes('alt=')) {
      suggestions.push({
        category: 'accessibility',
        priority: 'high',
        issue: 'Images without alt text',
        suggestion: 'Add descriptive alt text to images',
        example: '<img src="..." alt="Description of image" />'
      });
    }
    
    // Check for missing ARIA labels
    if (code.includes('button') && !code.includes('aria-label') && !code.includes('aria-describedby')) {
      suggestions.push({
        category: 'accessibility',
        priority: 'medium',
        issue: 'Interactive elements may need ARIA labels',
        suggestion: 'Add ARIA labels for screen readers',
        example: '<button aria-label="Close dialog">×</button>'
      });
    }
    
    // Check for form labels
    if (code.includes('<input') && !code.includes('label')) {
      suggestions.push({
        category: 'accessibility',
        priority: 'high',
        issue: 'Form inputs without labels',
        suggestion: 'Associate labels with form controls',
        example: '<label htmlFor="name">Name:</label><input id="name" />'
      });
    }
  }
  
  // Filter suggestions by priority if specified
  const filteredSuggestions = priority === 'all' ? suggestions : 
    suggestions.filter(s => s.priority === priority || s.priority === 'critical');
  
  // Sort by priority
  const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
  filteredSuggestions.sort((a, b) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0));
  
  const improvementResult = {
    action: 'suggest_improvements',
    focus,
    priority,
    codeStats: {
      lines: codeLength,
      functions: (code.match(/function\s+\w+|\w+\s*=\s*\(/g) || []).length,
      comments: (code.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length
    },
    suggestions: filteredSuggestions,
    summary: {
      total: filteredSuggestions.length,
      critical: filteredSuggestions.filter(s => s.priority === 'critical').length,
      high: filteredSuggestions.filter(s => s.priority === 'high').length,
      medium: filteredSuggestions.filter(s => s.priority === 'medium').length,
      low: filteredSuggestions.filter(s => s.priority === 'low').length
    },
    overallScore: Math.max(0, 100 - (filteredSuggestions.length * 10)),
    status: 'success'
  };
  
  const topSuggestions = filteredSuggestions.slice(0, 8);
  return {
    content: [{ type: 'text', text: `Focus: ${focus}\nScore: ${improvementResult.overallScore}/100\nSuggestions: ${improvementResult.summary.total} (${improvementResult.summary.critical}C ${improvementResult.summary.high}H ${improvementResult.summary.medium}M ${improvementResult.summary.low}L)\n\n${topSuggestions.map(s => `[${s.priority.toUpperCase()}] ${s.category}\n  Issue: ${s.issue}\n  Fix: ${s.suggestion}`).join('\n\n')}${filteredSuggestions.length > 8 ? `\n\n... ${filteredSuggestions.length - 8} more suggestions` : ''}` }]
  };
}