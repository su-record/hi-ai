// v2.0 - Advanced multi-strategy memory search

import { ToolResult, ToolDefinition, SearchStrategy } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const searchMemoriesAdvancedDefinition: ToolDefinition = {
  name: 'search_memories_advanced',
  description: `고급 멀티 전략 메모리 검색을 수행합니다.

키워드: 고급 검색, 찾아, 스마트 검색, advanced search, find memories

**검색 전략:**
- keyword: 전통적 키워드 검색
- graph_traversal: 그래프 기반 관련 메모리 탐색
- temporal: 시간순 정렬
- priority: 우선순위 기반
- context_aware: 복합 전략 (키워드 + 우선순위 + 최근성)

사용 예시:
- "authentication 관련 메모리 고급 검색"
- "그래프 탐색으로 project-architecture 관련 메모리 찾기"`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색 쿼리'
      },
      strategy: {
        type: 'string',
        description: '검색 전략',
        enum: ['keyword', 'graph_traversal', 'temporal', 'priority', 'context_aware']
      },
      limit: {
        type: 'number',
        description: '최대 결과 수 (기본값: 10)'
      },
      category: {
        type: 'string',
        description: '카테고리 필터'
      },
      startKey: {
        type: 'string',
        description: '그래프 탐색 시작 키 (graph_traversal 전략용)'
      },
      depth: {
        type: 'number',
        description: '그래프 탐색 깊이 (기본값: 2)'
      },
      includeRelations: {
        type: 'boolean',
        description: '관계 정보 포함 여부'
      }
    },
    required: ['query']
  },
  annotations: {
    title: 'Search Memories (Advanced)',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface SearchMemoriesAdvancedArgs {
  query: string;
  strategy?: SearchStrategy;
  limit?: number;
  category?: string;
  startKey?: string;
  depth?: number;
  includeRelations?: boolean;
}

export async function searchMemoriesAdvanced(args: SearchMemoriesAdvancedArgs): Promise<ToolResult> {
  try {
    const {
      query,
      strategy = 'context_aware',
      limit = 10,
      category,
      startKey,
      depth = 2,
      includeRelations = false
    } = args;

    const memoryManager = MemoryManager.getInstance();

    const results = memoryManager.searchAdvanced(query, strategy, {
      limit,
      category,
      startKey,
      depth,
      includeRelations
    });

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `✗ "${query}"에 대한 검색 결과가 없습니다.

**사용된 전략**: ${strategy}
${category ? `**카테고리 필터**: ${category}` : ''}

다른 검색 전략을 시도해보세요:
- keyword: 기본 키워드 매칭
- temporal: 최신 메모리 우선
- priority: 중요 메모리 우선
- context_aware: 종합 점수`
        }]
      };
    }

    let output = `## 검색 결과: "${query}"\n\n`;
    output += `**전략**: ${getStrategyDescription(strategy)}\n`;
    output += `**결과 수**: ${results.length}개\n\n`;

    for (let i = 0; i < results.length; i++) {
      const memory = results[i];
      output += `### ${i + 1}. ${memory.key}\n`;
      output += `- **카테고리**: ${memory.category}\n`;
      output += `- **우선순위**: ${memory.priority || 0}\n`;
      output += `- **생성일**: ${formatDate(memory.timestamp)}\n`;
      output += `- **마지막 접근**: ${formatDate(memory.lastAccessed)}\n`;

      // Include relations if requested
      if (includeRelations) {
        const relations = memoryManager.getRelations(memory.key, 'both');
        if (relations.length > 0) {
          output += `- **관계**: ${relations.length}개\n`;
          for (const rel of relations.slice(0, 3)) {
            const other = rel.sourceKey === memory.key ? rel.targetKey : rel.sourceKey;
            output += `  - ${rel.relationType} → ${other}\n`;
          }
          if (relations.length > 3) {
            output += `  - ... 외 ${relations.length - 3}개\n`;
          }
        }
      }

      // Show value preview
      const preview = memory.value.length > 200
        ? memory.value.substring(0, 200) + '...'
        : memory.value;
      output += `\n\`\`\`\n${preview}\n\`\`\`\n\n`;
    }

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
        text: `✗ 검색 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }]
    };
  }
}

function getStrategyDescription(strategy: SearchStrategy): string {
  const descriptions: Record<SearchStrategy, string> = {
    keyword: '키워드 매칭',
    graph_traversal: '그래프 탐색',
    temporal: '시간순 정렬',
    priority: '우선순위 기반',
    context_aware: '복합 전략 (키워드 + 우선순위 + 최근성)'
  };
  return descriptions[strategy] || strategy;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}
