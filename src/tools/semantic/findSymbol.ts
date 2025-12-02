// Semantic code analysis tool - Find Symbol (v1.3)
// With ProjectCache for 25x performance improvement

import { Node } from 'ts-morph';
import * as path from 'path';
import { PythonParser } from '../../lib/PythonParser.js';
import { ProjectCache } from '../../lib/ProjectCache.js';
import { readFile } from 'fs/promises';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

interface SymbolInfo {
  name: string;
  kind: string;
  filePath: string;
  line: number;
  column: number;
  preview: string;
}

export const findSymbolDefinition: ToolDefinition = {
  name: 'find_symbol',
  description: '함수 찾아|클래스 어디|변수 위치|find function|where is|locate - Find symbol definitions',
  inputSchema: {
    type: 'object',
    properties: {
      symbolName: { type: 'string', description: 'Name of the symbol to find' },
      projectPath: { type: 'string', description: 'Project directory path' },
      symbolType: {
        type: 'string',
        enum: ['all', 'function', 'class', 'interface', 'variable', 'type'],
        description: 'Type of symbol to search for'
      }
    },
    required: ['symbolName', 'projectPath']
  },
  annotations: {
    title: 'Find Symbol',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function findSymbol(args: { 
  symbolName: string; 
  projectPath: string; 
  symbolType?: string 
}): Promise<ToolResult> {
  const { symbolName, projectPath, symbolType = 'all' } = args;
  
  try {
    // Use cached project for performance
    const projectCache = ProjectCache.getInstance();
    const project = projectCache.getOrCreate(projectPath);

    const symbols: SymbolInfo[] = [];

    // Check for Python files
    const glob = await import('glob');
    const pythonFiles = glob.globSync(path.join(projectPath, '**/*.py'), {
      ignore: ['**/node_modules/**', '**/.git/**', '**/venv/**', '**/__pycache__/**']
    });

    // Parse Python files
    for (const pyFile of pythonFiles) {
      try {
        const content = await readFile(pyFile, 'utf-8');
        const pythonSymbols = await PythonParser.findSymbols(content);

        for (const pySymbol of pythonSymbols) {
          if (pySymbol.name.includes(symbolName) &&
              (symbolType === 'all' || symbolType === pySymbol.kind)) {
            symbols.push({
              name: pySymbol.name,
              kind: pySymbol.kind,
              filePath: pyFile,
              line: pySymbol.line,
              column: pySymbol.column,
              preview: pySymbol.docstring?.substring(0, 100) || `${pySymbol.kind} ${pySymbol.name}`
            });
          }
        }
      } catch (error) {
        // Skip files that can't be parsed
        console.error(`Error parsing Python file ${pyFile}:`, error);
      }
    }

    // Search through all source files
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      
      // Skip node_modules and other irrelevant paths
      if (filePath.includes('node_modules') || filePath.includes('.git')) {
        continue;
      }
      
      // Find matching symbols based on type
      sourceFile.forEachDescendant((node) => {
        const nodeSymbol = extractSymbolInfo(node, symbolName, symbolType);
        if (nodeSymbol) {
          const start = node.getStartLinePos();
          const pos = sourceFile.getLineAndColumnAtPos(start);
          
          symbols.push({
            name: nodeSymbol.name,
            kind: nodeSymbol.kind,
            filePath: filePath,
            line: pos.line,
            column: pos.column,
            preview: node.getText().substring(0, 100)
          });
        }
      });
    }
    
    // Sort by relevance (exact matches first)
    symbols.sort((a, b) => {
      const aExact = a.name === symbolName ? 0 : 1;
      const bExact = b.name === symbolName ? 0 : 1;
      return aExact - bExact;
    });
    
    return {
      content: [{
        type: 'text',
        text: `Found ${symbols.length} symbols:\n${symbols.slice(0, 20).map(s =>
          `${s.name} (${s.kind}) - ${s.filePath}:${s.line}`
        ).join('\n')}`
      }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `Error finding symbol: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]
    };
  }
}

function extractSymbolInfo(
  node: Node, 
  symbolName: string, 
  symbolType: string
): { name: string; kind: string } | null {
  const kind = node.getKind();
  
  // Function declarations and expressions
  if (symbolType === 'all' || symbolType === 'function') {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const name = node.getName();
      if (name && name.includes(symbolName)) {
        return { name, kind: 'function' };
      }
    }
    if (Node.isVariableDeclaration(node)) {
      const name = node.getName();
      const initializer = node.getInitializer();
      if (name && name.includes(symbolName) && 
          (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
        return { name, kind: 'function' };
      }
    }
  }
  
  // Class declarations
  if (symbolType === 'all' || symbolType === 'class') {
    if (Node.isClassDeclaration(node)) {
      const name = node.getName();
      if (name && name.includes(symbolName)) {
        return { name, kind: 'class' };
      }
    }
  }
  
  // Interface declarations
  if (symbolType === 'all' || symbolType === 'interface') {
    if (Node.isInterfaceDeclaration(node)) {
      const name = node.getName();
      if (name && name.includes(symbolName)) {
        return { name, kind: 'interface' };
      }
    }
  }
  
  // Type aliases
  if (symbolType === 'all' || symbolType === 'type') {
    if (Node.isTypeAliasDeclaration(node)) {
      const name = node.getName();
      if (name && name.includes(symbolName)) {
        return { name, kind: 'type' };
      }
    }
  }
  
  // Variables
  if (symbolType === 'all' || symbolType === 'variable') {
    if (Node.isVariableDeclaration(node)) {
      const name = node.getName();
      const initializer = node.getInitializer();
      if (name && name.includes(symbolName) && 
          !Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer)) {
        return { name, kind: 'variable' };
      }
    }
  }
  
  return null;
}

function generateSummary(symbols: SymbolInfo[], query: string): string {
  if (symbols.length === 0) {
    return `No symbols found matching "${query}"`;
  }
  
  const byKind: Record<string, number> = {};
  symbols.forEach(s => {
    byKind[s.kind] = (byKind[s.kind] || 0) + 1;
  });
  
  const summary = Object.entries(byKind)
    .map(([kind, count]) => `${count} ${kind}${count > 1 ? 's' : ''}`)
    .join(', ');
  
  return `Found ${symbols.length} symbols: ${summary}`;
}

function formatSymbolResults(result: any): string {
  let output = `# Symbol Search Results\n\n`;
  output += `**Query:** ${result.query}\n`;
  output += `**Type:** ${result.type}\n`;
  output += `**Results:** ${result.resultsCount} symbols found\n\n`;
  
  if (result.symbols.length === 0) {
    output += `No symbols found matching "${result.query}".\n`;
    return output;
  }
  
  output += `## Found Symbols\n\n`;
  
  result.symbols.forEach((symbol: SymbolInfo, index: number) => {
    output += `### ${index + 1}. ${symbol.name} (${symbol.kind})\n`;
    output += `**Location:** ${symbol.filePath}:${symbol.line}:${symbol.column}\n`;
    output += `**Preview:**\n\`\`\`typescript\n${symbol.preview}\n\`\`\`\n\n`;
  });
  
  output += `\n## Summary\n${result.summary}`;
  
  return output;
}