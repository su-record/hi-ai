// v2.0 - Get usage analytics and telemetry

import { ToolResult, ToolDefinition, UsageStats } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const getUsageAnalyticsDefinition: ToolDefinition = {
  name: 'get_usage_analytics',
  description: `도구 사용 분석 및 통계를 조회합니다.

키워드: 분석, 통계, 사용량, analytics, statistics, usage

**제공 정보:**
- 메모리 사용 통계
- 카테고리별 분포
- 시간별 사용 패턴
- 그래프 관계 통계

사용 예시:
- "사용 통계 보여줘"
- "메모리 분석"`,
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: '분석 유형',
        enum: ['memory', 'graph', 'all']
      },
      timeRange: {
        type: 'string',
        description: '시간 범위',
        enum: ['1d', '7d', '30d', 'all']
      },
      detailed: {
        type: 'boolean',
        description: '상세 정보 포함 여부 (기본값: false)'
      }
    }
  },
  annotations: {
    title: 'Get Usage Analytics',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface GetUsageAnalyticsArgs {
  type?: 'memory' | 'graph' | 'all';
  timeRange?: '1d' | '7d' | '30d' | 'all';
  detailed?: boolean;
}

export async function getUsageAnalytics(args: GetUsageAnalyticsArgs): Promise<ToolResult> {
  try {
    const { type = 'all', timeRange = 'all', detailed = false } = args;
    const memoryManager = MemoryManager.getInstance();

    let output = '## Hi-AI 사용 분석\n\n';

    // Memory statistics
    if (type === 'memory' || type === 'all') {
      output += await generateMemoryStats(memoryManager, timeRange, detailed);
    }

    // Graph statistics
    if (type === 'graph' || type === 'all') {
      output += await generateGraphStats(memoryManager, detailed);
    }

    // System info
    output += `---\n### 시스템 정보\n\n`;
    output += `- **Hi-AI 버전**: 2.0.0\n`;
    output += `- **분석 시간**: ${new Date().toLocaleString('ko-KR')}\n`;
    output += `- **시간 범위**: ${getTimeRangeLabel(timeRange)}\n`;

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
        text: `✗ 분석 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]
    };
  }
}

async function generateMemoryStats(
  memoryManager: MemoryManager,
  timeRange: string,
  detailed: boolean
): Promise<string> {
  const stats = memoryManager.getStats();
  const allMemories = memoryManager.list();

  let output = '### 메모리 통계\n\n';
  output += `- **총 메모리 수**: ${stats.total}개\n`;
  output += `- **카테고리 수**: ${Object.keys(stats.byCategory).length}개\n\n`;

  // Category distribution
  output += `#### 카테고리별 분포\n\n`;
  const sortedCategories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, count] of sortedCategories) {
    const percentage = ((count / stats.total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / stats.total * 20));
    output += `- **${category}**: ${count}개 (${percentage}%) ${bar}\n`;
  }
  output += '\n';

  // Time analysis
  if (allMemories.length > 0) {
    output += `#### 시간 분석\n\n`;

    const now = new Date();
    const filterDate = getFilterDate(timeRange);

    const recentMemories = filterDate
      ? allMemories.filter(m => new Date(m.timestamp) >= filterDate)
      : allMemories;

    // Group by day
    const byDay: Record<string, number> = {};
    for (const memory of recentMemories) {
      const day = memory.timestamp.substring(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }

    const sortedDays = Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);

    if (sortedDays.length > 0) {
      output += `**최근 일별 활동**:\n`;
      for (const [day, count] of sortedDays) {
        const bar = '▓'.repeat(Math.min(count, 20));
        output += `- ${day}: ${count}개 ${bar}\n`;
      }
      output += '\n';
    }

    // Priority distribution
    const priorityCounts: Record<number, number> = {};
    for (const memory of allMemories) {
      const priority = memory.priority || 0;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    }

    if (Object.keys(priorityCounts).length > 1) {
      output += `**우선순위 분포**:\n`;
      for (const [priority, count] of Object.entries(priorityCounts).sort((a, b) => Number(b[0]) - Number(a[0]))) {
        output += `- 우선순위 ${priority}: ${count}개\n`;
      }
      output += '\n';
    }
  }

  // Detailed info
  if (detailed && allMemories.length > 0) {
    output += `#### 상세 정보\n\n`;

    // Most recently accessed
    const byAccess = [...allMemories]
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 5);

    output += `**최근 접근한 메모리**:\n`;
    for (const memory of byAccess) {
      output += `- \`${memory.key}\` (${formatDate(memory.lastAccessed)})\n`;
    }
    output += '\n';

    // Oldest memories
    const oldest = [...allMemories]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 5);

    output += `**가장 오래된 메모리**:\n`;
    for (const memory of oldest) {
      output += `- \`${memory.key}\` (${formatDate(memory.timestamp)})\n`;
    }
    output += '\n';
  }

  return output;
}

async function generateGraphStats(
  memoryManager: MemoryManager,
  detailed: boolean
): Promise<string> {
  const graph = memoryManager.getMemoryGraph();

  let output = '### 지식 그래프 통계\n\n';
  output += `- **노드 수**: ${graph.nodes.length}개\n`;
  output += `- **관계 수**: ${graph.edges.length}개\n`;
  output += `- **클러스터 수**: ${graph.clusters.length}개\n\n`;

  if (graph.edges.length > 0) {
    // Relation type distribution
    const relationTypes: Record<string, number> = {};
    for (const edge of graph.edges) {
      relationTypes[edge.relationType] = (relationTypes[edge.relationType] || 0) + 1;
    }

    output += `#### 관계 유형 분포\n\n`;
    for (const [type, count] of Object.entries(relationTypes).sort((a, b) => b[1] - a[1])) {
      output += `- **${type}**: ${count}개\n`;
    }
    output += '\n';

    // Average connections per node
    const avgConnections = (graph.edges.length * 2 / graph.nodes.length).toFixed(2);
    output += `- **평균 연결 수**: ${avgConnections}개/노드\n`;

    // Most connected nodes
    const connectionCount: Record<string, number> = {};
    for (const edge of graph.edges) {
      connectionCount[edge.sourceKey] = (connectionCount[edge.sourceKey] || 0) + 1;
      connectionCount[edge.targetKey] = (connectionCount[edge.targetKey] || 0) + 1;
    }

    const topConnected = Object.entries(connectionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topConnected.length > 0) {
      output += `\n**가장 많이 연결된 노드**:\n`;
      for (const [key, count] of topConnected) {
        output += `- \`${key}\`: ${count}개 연결\n`;
      }
      output += '\n';
    }
  }

  // Cluster info
  if (graph.clusters.length > 0 && detailed) {
    output += `#### 클러스터 상세\n\n`;
    for (let i = 0; i < Math.min(graph.clusters.length, 5); i++) {
      const cluster = graph.clusters[i];
      output += `**클러스터 ${i + 1}** (${cluster.length}개 노드):\n`;
      output += `- ${cluster.slice(0, 5).join(', ')}`;
      if (cluster.length > 5) {
        output += ` ... 외 ${cluster.length - 5}개`;
      }
      output += '\n';
    }
    output += '\n';
  }

  return output;
}

function getFilterDate(timeRange: string): Date | null {
  const now = new Date();

  switch (timeRange) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case '1d':
      return '최근 24시간';
    case '7d':
      return '최근 7일';
    case '30d':
      return '최근 30일';
    default:
      return '전체';
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  } catch {
    return dateString;
  }
}
