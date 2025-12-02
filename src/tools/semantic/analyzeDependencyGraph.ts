// v2.0 - Analyze code dependency graph

import { ToolResult, ToolDefinition } from '../../types/tool.js';
import { ProjectCache } from '../../lib/ProjectCache.js';
import { Node, SyntaxKind } from 'ts-morph';

export const analyzeDependencyGraphDefinition: ToolDefinition = {
  name: 'analyze_dependency_graph',
  description: `코드 의존성 그래프를 분석합니다.

키워드: 의존성, 관계 분석, 순환 참조, dependency graph, circular dependency

**분석 내용:**
- 파일 간 import/export 관계
- 순환 의존성 감지
- 모듈 클러스터 식별
- 코드 결합도 분석

사용 예시:
- "src 폴더의 의존성 그래프 분석해줘"
- "index.ts의 의존 관계 보여줘"`,
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: '프로젝트 경로'
      },
      targetFile: {
        type: 'string',
        description: '특정 파일 분석 (선택사항)'
      },
      maxDepth: {
        type: 'number',
        description: '최대 탐색 깊이 (기본값: 3)'
      },
      includeExternal: {
        type: 'boolean',
        description: '외부 패키지 포함 여부 (기본값: false)'
      },
      detectCircular: {
        type: 'boolean',
        description: '순환 의존성 감지 (기본값: true)'
      }
    },
    required: ['projectPath']
  },
  annotations: {
    title: 'Analyze Dependency Graph',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface AnalyzeDependencyGraphArgs {
  projectPath: string;
  targetFile?: string;
  maxDepth?: number;
  includeExternal?: boolean;
  detectCircular?: boolean;
}

interface DependencyNode {
  file: string;
  imports: string[];
  exports: string[];
  depth: number;
}

interface DependencyGraph {
  nodes: DependencyNode[];
  edges: Array<{ from: string; to: string; type: 'import' | 'export' }>;
  circularDependencies: string[][];
  clusters: string[][];
}

export async function analyzeDependencyGraph(args: AnalyzeDependencyGraphArgs): Promise<ToolResult> {
  try {
    const {
      projectPath,
      targetFile,
      maxDepth = 3,
      includeExternal = false,
      detectCircular = true
    } = args;

    const project = ProjectCache.getInstance().getOrCreate(projectPath);
    const sourceFiles = project.getSourceFiles();

    if (sourceFiles.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `✗ 프로젝트에서 소스 파일을 찾을 수 없습니다: ${projectPath}`
        }]
      };
    }

    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
      circularDependencies: [],
      clusters: []
    };

    const fileMap = new Map<string, DependencyNode>();
    const adjacencyList = new Map<string, Set<string>>();

    // Build dependency graph
    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = getRelativePath(filePath, projectPath);

      // Skip if targeting specific file and this isn't it or related
      if (targetFile && !relativePath.includes(targetFile) && !shouldIncludeInGraph(relativePath, targetFile, maxDepth)) {
        continue;
      }

      const imports: string[] = [];
      const exports: string[] = [];

      // Get imports
      const importDeclarations = sourceFile.getImportDeclarations();
      for (const imp of importDeclarations) {
        const moduleSpecifier = imp.getModuleSpecifierValue();

        // Skip external packages unless requested
        if (!includeExternal && (moduleSpecifier.startsWith('@') || !moduleSpecifier.startsWith('.'))) {
          continue;
        }

        const resolvedPath = resolveImportPath(moduleSpecifier, filePath, projectPath);
        if (resolvedPath) {
          imports.push(resolvedPath);

          // Add edge
          graph.edges.push({
            from: relativePath,
            to: resolvedPath,
            type: 'import'
          });

          // Update adjacency list
          if (!adjacencyList.has(relativePath)) {
            adjacencyList.set(relativePath, new Set());
          }
          adjacencyList.get(relativePath)!.add(resolvedPath);
        }
      }

      // Get exports
      const exportDeclarations = sourceFile.getExportDeclarations();
      for (const exp of exportDeclarations) {
        const namedExports = exp.getNamedExports();
        for (const named of namedExports) {
          exports.push(named.getName());
        }
      }

      // Also get exported declarations
      const exportedDeclarations = sourceFile.getExportedDeclarations();
      exportedDeclarations.forEach((declarations: any[], name: string) => {
        if (!exports.includes(name)) {
          exports.push(name);
        }
      });

      const node: DependencyNode = {
        file: relativePath,
        imports,
        exports,
        depth: 0
      };

      fileMap.set(relativePath, node);
      graph.nodes.push(node);
    }

    // Detect circular dependencies
    if (detectCircular) {
      graph.circularDependencies = findCircularDependencies(adjacencyList);
    }

    // Detect clusters (strongly connected components)
    graph.clusters = findClusters(adjacencyList);

    // Generate output
    let output = `## 의존성 그래프 분석\n\n`;
    output += `**프로젝트**: ${projectPath}\n`;
    output += `**분석된 파일**: ${graph.nodes.length}개\n`;
    output += `**의존 관계**: ${graph.edges.length}개\n\n`;

    // Show target file dependencies if specified
    if (targetFile) {
      const targetNode = graph.nodes.find(n => n.file.includes(targetFile));
      if (targetNode) {
        output += `### ${targetFile} 의존성\n\n`;
        output += `**Imports** (${targetNode.imports.length}개):\n`;
        for (const imp of targetNode.imports) {
          output += `- ← ${imp}\n`;
        }
        output += `\n**Exports** (${targetNode.exports.length}개):\n`;
        for (const exp of targetNode.exports) {
          output += `- → ${exp}\n`;
        }
        output += '\n';
      }
    }

    // Circular dependencies warning
    if (graph.circularDependencies.length > 0) {
      output += `### ⚠️ 순환 의존성 감지됨\n\n`;
      for (const cycle of graph.circularDependencies) {
        output += `- ${cycle.join(' → ')} → ${cycle[0]}\n`;
      }
      output += '\n';
    }

    // Clusters
    if (graph.clusters.length > 0) {
      output += `### 모듈 클러스터\n\n`;
      for (let i = 0; i < graph.clusters.length; i++) {
        if (graph.clusters[i].length > 1) {
          output += `**클러스터 ${i + 1}** (${graph.clusters[i].length}개):\n`;
          for (const file of graph.clusters[i].slice(0, 5)) {
            output += `  - ${file}\n`;
          }
          if (graph.clusters[i].length > 5) {
            output += `  - ... 외 ${graph.clusters[i].length - 5}개\n`;
          }
          output += '\n';
        }
      }
    }

    // Mermaid diagram for small graphs
    if (graph.nodes.length <= 20) {
      output += `### 의존성 다이어그램\n\n`;
      output += generateMermaidDiagram(graph);
    }

    // Statistics
    output += `### 통계\n\n`;
    output += generateStatistics(graph);

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `✗ 의존성 분석 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]
    };
  }
}

function getRelativePath(filePath: string, projectPath: string): string {
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedProject = projectPath.replace(/\\/g, '/');
  return normalizedFile.replace(normalizedProject, '').replace(/^\//, '');
}

function resolveImportPath(moduleSpecifier: string, fromFile: string, projectPath: string): string | null {
  if (!moduleSpecifier.startsWith('.')) {
    return null;
  }

  // Simple resolution - in real implementation would use ts-morph's resolution
  const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
  let resolved = moduleSpecifier;

  if (moduleSpecifier.startsWith('./')) {
    resolved = `${fromDir}/${moduleSpecifier.substring(2)}`;
  } else if (moduleSpecifier.startsWith('../')) {
    const parts = fromDir.split('/');
    const upCount = (moduleSpecifier.match(/\.\.\//g) || []).length;
    parts.splice(-upCount);
    resolved = `${parts.join('/')}/${moduleSpecifier.replace(/\.\.\//g, '')}`;
  }

  // Add .ts extension if missing
  if (!resolved.endsWith('.ts') && !resolved.endsWith('.js')) {
    resolved += '.ts';
  }

  return getRelativePath(resolved, projectPath);
}

function shouldIncludeInGraph(file: string, targetFile: string, maxDepth: number): boolean {
  // Simple heuristic - include files in same or nearby directories
  const targetDir = targetFile.substring(0, targetFile.lastIndexOf('/'));
  return file.startsWith(targetDir);
}

function findCircularDependencies(adjacencyList: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycles.push([...cycle]);
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const node of adjacencyList.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

function findClusters(adjacencyList: Map<string, Set<string>>): string[][] {
  // Simple connected components using Union-Find
  const parent: Record<string, string> = {};

  for (const node of adjacencyList.keys()) {
    parent[node] = node;
  }

  function find(x: string): string {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }

  function union(x: string, y: string) {
    const px = find(x);
    const py = find(y);
    if (px !== py) {
      parent[px] = py;
    }
  }

  for (const [node, neighbors] of adjacencyList) {
    for (const neighbor of neighbors) {
      if (parent[neighbor] !== undefined) {
        union(node, neighbor);
      }
    }
  }

  const clusters: Record<string, string[]> = {};
  for (const node of adjacencyList.keys()) {
    const root = find(node);
    if (!clusters[root]) {
      clusters[root] = [];
    }
    clusters[root].push(node);
  }

  return Object.values(clusters).filter(c => c.length > 1);
}

function generateMermaidDiagram(graph: DependencyGraph): string {
  let diagram = '```mermaid\ngraph TD\n';

  // Add nodes
  for (const node of graph.nodes) {
    const id = node.file.replace(/[^a-zA-Z0-9]/g, '_');
    const label = node.file.split('/').pop() || node.file;
    diagram += `  ${id}["${label}"]\n`;
  }

  // Add edges
  for (const edge of graph.edges) {
    const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
    const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
    diagram += `  ${fromId} --> ${toId}\n`;
  }

  diagram += '```\n';
  return diagram;
}

function generateStatistics(graph: DependencyGraph): string {
  // Calculate metrics
  const importCounts = new Map<string, number>();
  const exportCounts = new Map<string, number>();

  for (const edge of graph.edges) {
    importCounts.set(edge.to, (importCounts.get(edge.to) || 0) + 1);
    exportCounts.set(edge.from, (exportCounts.get(edge.from) || 0) + 1);
  }

  // Most imported files
  const topImported = [...importCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Files with most dependencies
  const topDependencies = graph.nodes
    .map(n => ({ file: n.file, count: n.imports.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  let stats = `- **총 파일**: ${graph.nodes.length}개\n`;
  stats += `- **총 의존 관계**: ${graph.edges.length}개\n`;
  stats += `- **순환 의존성**: ${graph.circularDependencies.length}개\n`;
  stats += `- **클러스터**: ${graph.clusters.length}개\n\n`;

  if (topImported.length > 0) {
    stats += `**가장 많이 참조되는 파일**:\n`;
    for (const [file, count] of topImported) {
      stats += `- ${file}: ${count}회\n`;
    }
    stats += '\n';
  }

  if (topDependencies.length > 0) {
    stats += `**의존성이 많은 파일**:\n`;
    for (const { file, count } of topDependencies) {
      stats += `- ${file}: ${count}개 import\n`;
    }
  }

  return stats;
}
