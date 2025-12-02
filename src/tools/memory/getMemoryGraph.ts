// v2.0 - Get memory graph structure (Knowledge Graph visualization)

import { ToolResult, ToolDefinition } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const getMemoryGraphDefinition: ToolDefinition = {
  name: 'get_memory_graph',
  description: `메모리 지식 그래프를 조회합니다.

키워드: 그래프, 관계도, 연결 보기, memory graph, relations, connections

사용 예시:
- "project-architecture의 관계 그래프 보여줘"
- "전체 메모리 그래프 조회"`,
  inputSchema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: '시작 메모리 키 (없으면 전체 그래프)'
      },
      depth: {
        type: 'number',
        description: '탐색 깊이 (기본값: 2)',
        minimum: 1,
        maximum: 5
      },
      relationType: {
        type: 'string',
        description: '필터링할 관계 유형'
      },
      format: {
        type: 'string',
        description: '출력 형식',
        enum: ['tree', 'list', 'mermaid']
      }
    }
  },
  annotations: {
    title: 'Get Memory Graph',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface GetMemoryGraphArgs {
  key?: string;
  depth?: number;
  relationType?: string;
  format?: 'tree' | 'list' | 'mermaid';
}

export async function getMemoryGraph(args: GetMemoryGraphArgs): Promise<ToolResult> {
  try {
    const { key, depth = 2, relationType, format = 'tree' } = args;
    const memoryManager = MemoryManager.getInstance();

    const graph = memoryManager.getMemoryGraph(key, depth);

    if (graph.nodes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: key
            ? `✗ 메모리를 찾을 수 없거나 관계가 없습니다: ${key}`
            : `✗ 저장된 메모리가 없습니다`
        }]
      };
    }

    // Filter by relation type if specified
    let filteredEdges = graph.edges;
    if (relationType) {
      filteredEdges = graph.edges.filter(e => e.relationType === relationType);
    }

    let output = '';

    switch (format) {
      case 'mermaid':
        output = generateMermaidDiagram(graph.nodes, filteredEdges);
        break;
      case 'list':
        output = generateListFormat(graph.nodes, filteredEdges);
        break;
      case 'tree':
      default:
        output = generateTreeFormat(key, graph.nodes, filteredEdges);
    }

    // Add statistics
    const stats = `
---
**통계**
- 노드 수: ${graph.nodes.length}
- 관계 수: ${filteredEdges.length}
- 클러스터 수: ${graph.clusters.length}
${graph.clusters.length > 0 ? `- 클러스터: ${graph.clusters.map(c => `[${c.join(', ')}]`).join(', ')}` : ''}`;

    return {
      content: [{
        type: 'text',
        text: output + stats
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]
    };
  }
}

function generateTreeFormat(startKey: string | undefined, nodes: any[], edges: any[]): string {
  let output = '## 메모리 그래프\n\n';

  if (startKey) {
    output += `**시작점**: ${startKey}\n\n`;
  }

  // Build adjacency list
  const adjacency: Record<string, Array<{ target: string; type: string; strength: number }>> = {};

  for (const edge of edges) {
    if (!adjacency[edge.sourceKey]) {
      adjacency[edge.sourceKey] = [];
    }
    adjacency[edge.sourceKey].push({
      target: edge.targetKey,
      type: edge.relationType,
      strength: edge.strength
    });
  }

  // Generate tree view
  const visited = new Set<string>();

  function printNode(key: string, indent: number): string {
    if (visited.has(key)) return '';
    visited.add(key);

    const node = nodes.find(n => n.key === key);
    if (!node) return '';

    let result = '  '.repeat(indent) + `📦 **${key}** [${node.category}]\n`;

    const relations = adjacency[key] || [];
    for (const rel of relations) {
      const arrow = getRelationArrow(rel.type);
      result += '  '.repeat(indent + 1) + `${arrow} ${rel.target} (${rel.type}, ${rel.strength})\n`;
      result += printNode(rel.target, indent + 2);
    }

    return result;
  }

  if (startKey) {
    output += printNode(startKey, 0);
  } else {
    for (const node of nodes) {
      if (!visited.has(node.key)) {
        output += printNode(node.key, 0);
        output += '\n';
      }
    }
  }

  return output;
}

function generateListFormat(nodes: any[], edges: any[]): string {
  let output = '## 메모리 그래프 (목록)\n\n';

  output += '### 노드\n';
  for (const node of nodes) {
    output += `- **${node.key}** [${node.category}]: ${node.value.substring(0, 50)}${node.value.length > 50 ? '...' : ''}\n`;
  }

  output += '\n### 관계\n';
  for (const edge of edges) {
    output += `- ${edge.sourceKey} --[${edge.relationType}]--> ${edge.targetKey} (강도: ${edge.strength})\n`;
  }

  return output;
}

function generateMermaidDiagram(nodes: any[], edges: any[]): string {
  let output = '## 메모리 그래프 (Mermaid)\n\n```mermaid\ngraph LR\n';

  // Add nodes with categories as subgraphs
  const categories: Record<string, string[]> = {};
  for (const node of nodes) {
    if (!categories[node.category]) {
      categories[node.category] = [];
    }
    categories[node.category].push(node.key);
  }

  for (const [category, keys] of Object.entries(categories)) {
    output += `  subgraph ${category}\n`;
    for (const key of keys) {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
      output += `    ${safeKey}["${key}"]\n`;
    }
    output += '  end\n';
  }

  // Add edges
  for (const edge of edges) {
    const sourceKey = edge.sourceKey.replace(/[^a-zA-Z0-9]/g, '_');
    const targetKey = edge.targetKey.replace(/[^a-zA-Z0-9]/g, '_');
    output += `  ${sourceKey} -->|${edge.relationType}| ${targetKey}\n`;
  }

  output += '```\n';

  return output;
}

function getRelationArrow(relationType: string): string {
  const arrows: Record<string, string> = {
    'related_to': '↔️',
    'depends_on': '⬅️',
    'implements': '🔧',
    'extends': '📈',
    'uses': '🔗',
    'references': '📎',
    'part_of': '📦'
  };
  return arrows[relationType] || '➡️';
}
