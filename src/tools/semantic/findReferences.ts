// Semantic code analysis tool - Find References (v1.3)
// With ProjectCache for 25x performance improvement

import { Node, ReferencedSymbol } from 'ts-morph';
import * as path from 'path';
import { PythonParser } from '../../lib/PythonParser.js';
import { ProjectCache } from '../../lib/ProjectCache.js';
import { readFile } from 'fs/promises';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

interface ReferenceInfo {
  filePath: string;
  line: number;
  column: number;
  text: string;
  isDefinition: boolean;
}

export const findReferencesDefinition: ToolDefinition = {
  name: 'find_references',
  description: '어디서 쓰|참조|사용처|find usage|references|where used - Find symbol references',
  inputSchema: {
    type: 'object',
    properties: {
      symbolName: { type: 'string', description: 'Name of the symbol to find references for' },
      filePath: { type: 'string', description: 'File path where the symbol is defined' },
      line: { type: 'number', description: 'Line number of the symbol definition' },
      projectPath: { type: 'string', description: 'Project directory path' }
    },
    required: ['symbolName', 'projectPath']
  },
  annotations: {
    title: 'Find References',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function findReferences(args: { 
  symbolName: string;
  filePath?: string;
  line?: number;
  projectPath: string;
}): Promise<ToolResult> {
  const { symbolName, filePath, line, projectPath } = args;
  
  try {
    // Use cached project for performance
    const projectCache = ProjectCache.getInstance();
    const project = projectCache.getOrCreate(projectPath);

    const allReferences: ReferenceInfo[] = [];

    // Check for Python files
    const glob = await import('glob');
    const pythonFiles = glob.globSync(path.join(projectPath, '**/*.py'), {
      ignore: ['**/node_modules/**', '**/.git/**', '**/venv/**', '**/__pycache__/**']
    });

    // Parse Python files for references
    for (const pyFile of pythonFiles) {
      try {
        const content = await readFile(pyFile, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.includes(symbolName)) {
            const column = line.indexOf(symbolName);
            allReferences.push({
              filePath: pyFile,
              line: index + 1,
              column: column,
              text: line.trim().substring(0, 100),
              isDefinition: /^(def|class)\s/.test(line.trim())
            });
          }
        });
      } catch (error) {
        console.error(`Error parsing Python file ${pyFile}:`, error);
      }
    }
    
    // If specific file and line provided, use precise reference finding
    if (filePath && line) {
      const sourceFile = project.getSourceFile(filePath);
      if (sourceFile) {
        const position = sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, 0);
        const node = sourceFile.getDescendantAtPos(position);
        
        if (node) {
          const symbol = node.getSymbol();
          if (symbol) {
            const references = project.getLanguageService().findReferencesAtPosition(sourceFile, position);
            
            if (references) {
              for (const ref of references) {
                for (const reference of ref.getReferences()) {
                  const refSourceFile = reference.getSourceFile();
                  const refNode = reference.getNode();
                  const start = refNode.getStartLinePos();
                  const pos = refSourceFile.getLineAndColumnAtPos(start);
                  
                  allReferences.push({
                    filePath: refSourceFile.getFilePath(),
                    line: pos.line,
                    column: pos.column,
                    text: refNode.getParent()?.getText().substring(0, 100) || refNode.getText(),
                    isDefinition: reference.isDefinition() || false
                  });
                }
              }
            }
          }
        }
      }
    } else {
      // Fallback: search by name across all files
      for (const sourceFile of project.getSourceFiles()) {
        const filePath = sourceFile.getFilePath();
        
        // Skip node_modules and other irrelevant paths
        if (filePath.includes('node_modules') || filePath.includes('.git')) {
          continue;
        }
        
        // Find all identifiers matching the symbol name
        sourceFile.forEachDescendant((node) => {
          if (Node.isIdentifier(node) && node.getText() === symbolName) {
            const start = node.getStartLinePos();
            const pos = sourceFile.getLineAndColumnAtPos(start);
            const parent = node.getParent();
            
            // Determine if this is a definition
            const isDefinition = isSymbolDefinition(node);
            
            allReferences.push({
              filePath: filePath,
              line: pos.line,
              column: pos.column,
              text: parent?.getText().substring(0, 100) || node.getText(),
              isDefinition
            });
          }
        });
      }
    }
    
    const definitions = allReferences.filter(r => r.isDefinition);
    const usages = allReferences.filter(r => !r.isDefinition);

    return {
      content: [{
        type: 'text',
        text: `Found ${allReferences.length} references (${definitions.length} defs, ${usages.length} uses):\n${allReferences.slice(0, 20).map(r =>
          `${r.isDefinition ? 'DEF' : 'USE'}: ${r.filePath}:${r.line}`
        ).join('\n')}`
      }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `Error finding references: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]
    };
  }
}

function isSymbolDefinition(node: Node): boolean {
  const parent = node.getParent();
  if (!parent) return false;
  
  // Check if this is a declaration
  return Node.isFunctionDeclaration(parent) ||
         Node.isClassDeclaration(parent) ||
         Node.isInterfaceDeclaration(parent) ||
         Node.isTypeAliasDeclaration(parent) ||
         Node.isVariableDeclaration(parent) ||
         Node.isMethodDeclaration(parent) ||
         Node.isPropertyDeclaration(parent) ||
         Node.isParameterDeclaration(parent);
}

function groupReferencesByFile(references: ReferenceInfo[]): Record<string, ReferenceInfo[]> {
  const grouped: Record<string, ReferenceInfo[]> = {};
  
  for (const ref of references) {
    if (!grouped[ref.filePath]) {
      grouped[ref.filePath] = [];
    }
    grouped[ref.filePath].push(ref);
  }
  
  // Sort references within each file by line number
  for (const filePath in grouped) {
    grouped[filePath].sort((a, b) => a.line - b.line);
  }
  
  return grouped;
}

function formatReferenceResults(result: any): string {
  let output = `# Reference Search Results\n\n`;
  output += `**Symbol:** ${result.symbol}\n`;
  output += `**Total References:** ${result.totalReferences}\n`;
  output += `**Files:** ${result.filesCount}\n`;
  output += `**Definitions:** ${result.definitions.length}\n`;
  output += `**Usages:** ${result.usages.length}\n\n`;
  
  if (result.totalReferences === 0) {
    output += `No references found for "${result.symbol}".\n`;
    return output;
  }
  
  // Show definitions first
  if (result.definitions.length > 0) {
    output += `## Definitions\n\n`;
    result.definitions.forEach((def: ReferenceInfo, index: number) => {
      output += `${index + 1}. **${def.filePath}:${def.line}:${def.column}**\n`;
      output += `   \`\`\`typescript\n   ${def.text}\n   \`\`\`\n\n`;
    });
  }
  
  // Show usages grouped by file
  output += `## Usages by File\n\n`;
  
  for (const [filePath, refs] of Object.entries(result.references)) {
    const usages = (refs as ReferenceInfo[]).filter(r => !r.isDefinition);
    if (usages.length === 0) continue;
    
    output += `### ${filePath} (${usages.length} usages)\n\n`;
    usages.forEach((ref: ReferenceInfo) => {
      output += `- **Line ${ref.line}:** \`${ref.text.substring(0, 60)}...\`\n`;
    });
    output += `\n`;
  }
  
  return output;
}