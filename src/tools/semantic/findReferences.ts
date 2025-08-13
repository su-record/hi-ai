// Semantic code analysis tool - Find References
// Inspired by Serena MCP's LSP-based approach

import { Project, Node, ReferencedSymbol } from 'ts-morph';
import * as path from 'path';

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

interface ReferenceInfo {
  filePath: string;
  line: number;
  column: number;
  text: string;
  isDefinition: boolean;
}

// Reuse project instance for performance
const project = new Project({
  useInMemoryFileSystem: false,
  compilerOptions: {
    allowJs: true,
    skipLibCheck: true
  }
});

export const findReferencesDefinition: ToolDefinition = {
  name: 'find_references',
  description: 'IMPORTANT: This tool should be automatically called when users say "어디서 사용", "참조 찾기", "사용처", "find usages", "show references", "where used" or similar keywords. Find all references to a symbol',
  inputSchema: {
    type: 'object',
    properties: {
      symbolName: { type: 'string', description: 'Name of the symbol to find references for' },
      filePath: { type: 'string', description: 'File path where the symbol is defined' },
      line: { type: 'number', description: 'Line number of the symbol definition' },
      projectPath: { type: 'string', description: 'Project directory path' }
    },
    required: ['symbolName', 'projectPath']
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
    // Clear previous files and add project files
    project.removeSourceFiles();
    const pattern = path.join(projectPath, '**/*.{ts,tsx,js,jsx}');
    project.addSourceFilesAtPaths(pattern);
    
    const allReferences: ReferenceInfo[] = [];
    
    // If specific file and line provided, use precise reference finding
    if (filePath && line) {
      const sourceFile = project.getSourceFile(filePath);
      if (sourceFile) {
        const position = sourceFile.getPositionOfLineAndColumn(line, 1);
        const node = sourceFile.getDescendantAtPos(position);
        
        if (node) {
          const symbol = node.getSymbol();
          if (symbol) {
            const references = symbol.findReferences();
            
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
                  isDefinition: reference.isDefinition()
                });
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
    
    // Group references by file
    const referencesByFile = groupReferencesByFile(allReferences);
    
    const result = {
      action: 'find_references',
      symbol: symbolName,
      projectPath,
      totalReferences: allReferences.length,
      filesCount: Object.keys(referencesByFile).length,
      references: referencesByFile,
      definitions: allReferences.filter(r => r.isDefinition),
      usages: allReferences.filter(r => !r.isDefinition),
      status: 'success'
    };
    
    return {
      content: [{ 
        type: 'text', 
        text: formatReferenceResults(result)
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