// v2.1 - Get session context for automatic context injection
// This tool aggregates memories, knowledge graph, and timeline for session start

import { ToolResult, ToolDefinition } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const getSessionContextDefinition: ToolDefinition = {
  name: 'get_session_context',
  description: `🚀 [새 대화/세션 시작 시 자동 실행 권장] 이전 세션의 메모리, 지식 그래프, 최근 작업 내역을 한 번에 조회합니다.

이 도구는 새로운 대화를 시작할 때 가장 먼저 실행하면 좋습니다. 프로젝트의 컨텍스트를 빠르게 파악할 수 있습니다.

키워드: 세션 시작, 컨텍스트, 이전 작업, session start, context, previous work, what did we do

사용 예시:
- "이전에 무슨 작업 했었지?"
- "프로젝트 컨텍스트 알려줘"
- "세션 컨텍스트 조회"`,
  inputSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        description: '프로젝트명으로 필터링 (선택)'
      },
      category: {
        type: 'string',
        description: '카테고리로 필터링 (선택)'
      },
      memoryLimit: {
        type: 'number',
        description: '조회할 메모리 수 (기본값: 15)',
        default: 15
      },
      includeGraph: {
        type: 'boolean',
        description: '지식 그래프 포함 여부 (기본값: true)',
        default: true
      },
      includeTimeline: {
        type: 'boolean',
        description: '타임라인 포함 여부 (기본값: true)',
        default: true
      },
      timeRange: {
        type: 'string',
        description: '타임라인 조회 범위',
        enum: ['1d', '7d', '30d', 'all'],
        default: '7d'
      }
    }
  },
  annotations: {
    title: 'Get Session Context',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface GetSessionContextArgs {
  projectName?: string;
  category?: string;
  memoryLimit?: number;
  includeGraph?: boolean;
  includeTimeline?: boolean;
  timeRange?: '1d' | '7d' | '30d' | 'all';
}

export async function getSessionContext(args: GetSessionContextArgs): Promise<ToolResult> {
  try {
    const {
      projectName,
      category,
      memoryLimit = 15,
      includeGraph = true,
      includeTimeline = true,
      timeRange = '7d'
    } = args;

    const memoryManager = MemoryManager.getInstance();
    const sections: string[] = [];

    // Header
    sections.push('# 🧠 세션 컨텍스트\n');
    sections.push(`> 이전 세션의 메모리와 작업 내역입니다.\n`);

    // 1. Memory Statistics
    const stats = memoryManager.getStats();
    sections.push('## 📊 메모리 통계\n');
    sections.push(`- **총 메모리**: ${stats.total}개`);

    const categoryStats = Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
    sections.push(`- **카테고리**: ${categoryStats || '없음'}\n`);

    // 2. Recent Memories (Priority-sorted)
    sections.push('## 📝 주요 메모리\n');

    let memories = memoryManager.list(category);

    // Filter by project name if specified
    if (projectName) {
      memories = memories.filter(m =>
        m.key.toLowerCase().includes(projectName.toLowerCase()) ||
        m.value.toLowerCase().includes(projectName.toLowerCase()) ||
        m.category.toLowerCase().includes(projectName.toLowerCase())
      );
    }

    // Sort by priority (desc) then timestamp (desc)
    memories.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const topMemories = memories.slice(0, memoryLimit);

    if (topMemories.length === 0) {
      sections.push('_저장된 메모리가 없습니다._\n');
    } else {
      for (const memory of topMemories) {
        const priority = memory.priority ? `⭐${memory.priority}` : '';
        const preview = memory.value.length > 120
          ? memory.value.substring(0, 120) + '...'
          : memory.value;
        const date = formatDate(memory.timestamp);

        sections.push(`### ${memory.key} ${priority}`);
        sections.push(`**[${memory.category}]** | ${date}`);
        sections.push(`> ${preview}\n`);
      }
    }

    // 3. Knowledge Graph (if enabled and has relations)
    if (includeGraph && memories.length > 0) {
      const graph = memoryManager.getMemoryGraph(undefined, 2);

      if (graph.edges.length > 0) {
        sections.push('## 🔗 지식 그래프\n');

        // Show key relationships
        const relationSummary = summarizeRelations(graph.edges);
        sections.push(relationSummary);

        // Show clusters
        if (graph.clusters.length > 0) {
          sections.push('\n**관련 그룹**:');
          for (const cluster of graph.clusters.slice(0, 3)) {
            sections.push(`- [${cluster.join(' ↔ ')}]`);
          }
        }
        sections.push('');
      }
    }

    // 4. Recent Timeline (if enabled)
    if (includeTimeline) {
      sections.push('## 📅 최근 타임라인\n');

      const startDate = getStartDate(timeRange);
      const timeline = memoryManager.getTimeline(startDate, undefined, 10);

      if (timeline.length === 0) {
        sections.push('_최근 활동이 없습니다._\n');
      } else {
        const groupedByDate = groupByDate(timeline);

        for (const [date, items] of Object.entries(groupedByDate).slice(0, 5)) {
          sections.push(`**${date}**`);
          for (const item of (items as any[]).slice(0, 3)) {
            sections.push(`- \`${item.key}\`: ${item.value.substring(0, 50)}${item.value.length > 50 ? '...' : ''}`);
          }
        }
        sections.push('');
      }
    }

    // 5. Quick Actions Hint
    sections.push('---');
    sections.push('## 💡 다음 단계\n');
    sections.push('- 특정 메모리 상세 조회: `recall_memory`');
    sections.push('- 새 메모리 저장: `save_memory`');
    sections.push('- 그래프 탐색: `get_memory_graph`');
    sections.push('- 고급 검색: `search_memories_advanced`');

    return {
      content: [{
        type: 'text',
        text: sections.join('\n')
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `✗ 세션 컨텍스트 조회 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]
    };
  }
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return date.toLocaleDateString('ko-KR');
  } catch {
    return timestamp.substring(0, 10);
  }
}

function getStartDate(timeRange: string): string | undefined {
  const now = new Date();

  switch (timeRange) {
    case '1d':
      now.setDate(now.getDate() - 1);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case 'all':
      return undefined;
    default:
      now.setDate(now.getDate() - 7);
  }

  return now.toISOString();
}

function groupByDate(memories: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const memory of memories) {
    const date = memory.timestamp.substring(0, 10);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(memory);
  }

  return grouped;
}

function summarizeRelations(edges: any[]): string {
  const relationTypes: Record<string, number> = {};

  for (const edge of edges) {
    relationTypes[edge.relationType] = (relationTypes[edge.relationType] || 0) + 1;
  }

  const lines: string[] = [];

  // Show top 5 relations
  const topEdges = edges.slice(0, 5);
  for (const edge of topEdges) {
    const arrow = getRelationArrow(edge.relationType);
    lines.push(`- ${edge.sourceKey} ${arrow} ${edge.targetKey} (${edge.relationType})`);
  }

  if (edges.length > 5) {
    lines.push(`- _... 외 ${edges.length - 5}개의 관계_`);
  }

  return lines.join('\n');
}

function getRelationArrow(relationType: string): string {
  const arrows: Record<string, string> = {
    'related_to': '↔',
    'depends_on': '←',
    'implements': '→',
    'extends': '⊃',
    'uses': '→',
    'references': '⇢',
    'part_of': '⊂'
  };
  return arrows[relationType] || '→';
}
