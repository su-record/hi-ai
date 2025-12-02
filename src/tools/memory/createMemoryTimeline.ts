// v2.0 - Create memory timeline visualization

import { ToolResult, ToolDefinition } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const createMemoryTimelineDefinition: ToolDefinition = {
  name: 'create_memory_timeline',
  description: `메모리 타임라인을 생성합니다.

키워드: 타임라인, 시간순, 히스토리, timeline, history, chronological

사용 예시:
- "최근 메모리 타임라인 보여줘"
- "지난 7일간 메모리 히스토리"`,
  inputSchema: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: '시작 날짜 (ISO 형식, 예: 2024-01-01)'
      },
      endDate: {
        type: 'string',
        description: '종료 날짜 (ISO 형식)'
      },
      category: {
        type: 'string',
        description: '카테고리 필터'
      },
      limit: {
        type: 'number',
        description: '최대 결과 수 (기본값: 20)'
      },
      groupBy: {
        type: 'string',
        description: '그룹화 기준',
        enum: ['day', 'week', 'month', 'category']
      }
    }
  },
  annotations: {
    title: 'Create Memory Timeline',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface CreateMemoryTimelineArgs {
  startDate?: string;
  endDate?: string;
  category?: string;
  limit?: number;
  groupBy?: 'day' | 'week' | 'month' | 'category';
}

export async function createMemoryTimeline(args: CreateMemoryTimelineArgs): Promise<ToolResult> {
  try {
    const {
      startDate,
      endDate,
      category,
      limit = 20,
      groupBy = 'day'
    } = args;

    const memoryManager = MemoryManager.getInstance();
    let memories = memoryManager.getTimeline(startDate, endDate, limit);

    // Filter by category if specified
    if (category) {
      memories = memories.filter(m => m.category === category);
    }

    if (memories.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `✗ 지정된 기간에 메모리가 없습니다.

${startDate ? `**시작일**: ${startDate}` : ''}
${endDate ? `**종료일**: ${endDate}` : ''}
${category ? `**카테고리**: ${category}` : ''}`
        }]
      };
    }

    let output = '## 메모리 타임라인\n\n';

    // Add filter info
    if (startDate || endDate || category) {
      output += '**필터**:\n';
      if (startDate) output += `- 시작: ${startDate}\n`;
      if (endDate) output += `- 종료: ${endDate}\n`;
      if (category) output += `- 카테고리: ${category}\n`;
      output += '\n';
    }

    // Group memories
    const grouped = groupMemories(memories, groupBy);

    for (const [groupKey, groupMemories] of Object.entries(grouped)) {
      output += `### ${formatGroupKey(groupKey, groupBy)}\n\n`;

      for (const memory of groupMemories as any[]) {
        const time = formatTime(memory.timestamp);
        const priority = memory.priority ? `⭐${memory.priority}` : '';
        const preview = memory.value.length > 100
          ? memory.value.substring(0, 100) + '...'
          : memory.value;

        output += `**${time}** | \`${memory.key}\` ${priority}\n`;
        output += `> ${preview}\n\n`;
      }
    }

    // Statistics
    const stats = generateTimelineStats(memories);
    output += `---\n## 통계\n${stats}`;

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
        text: `✗ 타임라인 생성 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]
    };
  }
}

function groupMemories(
  memories: any[],
  groupBy: 'day' | 'week' | 'month' | 'category'
): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const memory of memories) {
    let key: string;

    switch (groupBy) {
      case 'day':
        key = memory.timestamp.substring(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        const date = new Date(memory.timestamp);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10);
        break;
      case 'month':
        key = memory.timestamp.substring(0, 7); // YYYY-MM
        break;
      case 'category':
        key = memory.category;
        break;
      default:
        key = memory.timestamp.substring(0, 10);
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(memory);
  }

  return grouped;
}

function formatGroupKey(key: string, groupBy: string): string {
  switch (groupBy) {
    case 'day':
      return `📅 ${key}`;
    case 'week':
      return `📆 ${key} 주간`;
    case 'month':
      return `🗓️ ${key}`;
    case 'category':
      return `📁 ${key}`;
    default:
      return key;
  }
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timestamp.substring(11, 16);
  }
}

function generateTimelineStats(memories: any[]): string {
  const categories: Record<string, number> = {};
  let totalPriority = 0;
  let priorityCount = 0;

  for (const memory of memories) {
    categories[memory.category] = (categories[memory.category] || 0) + 1;
    if (memory.priority) {
      totalPriority += memory.priority;
      priorityCount++;
    }
  }

  let stats = `- **총 메모리**: ${memories.length}개\n`;
  stats += `- **평균 우선순위**: ${priorityCount > 0 ? (totalPriority / priorityCount).toFixed(1) : 'N/A'}\n`;
  stats += `- **카테고리 분포**:\n`;

  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    const percentage = ((count / memories.length) * 100).toFixed(1);
    stats += `  - ${cat}: ${count}개 (${percentage}%)\n`;
  }

  return stats;
}
