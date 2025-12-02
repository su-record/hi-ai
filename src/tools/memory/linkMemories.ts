// v2.0 - Link memories with relationships (Knowledge Graph)

import { ToolResult, ToolDefinition } from '../../types/tool.js';
import { MemoryManager } from '../../lib/MemoryManager.js';

export const linkMemoriesDefinition: ToolDefinition = {
  name: 'link_memories',
  description: `메모리 간 관계를 연결합니다 (지식 그래프).

키워드: 연결해, 관계 설정, 링크, connect memories, link, relate

사용 예시:
- "project-architecture와 design-patterns를 연결해"
- "이 두 메모리를 related_to로 링크해"`,
  inputSchema: {
    type: 'object',
    properties: {
      sourceKey: {
        type: 'string',
        description: '소스 메모리 키'
      },
      targetKey: {
        type: 'string',
        description: '타겟 메모리 키'
      },
      relationType: {
        type: 'string',
        description: '관계 유형 (related_to, depends_on, implements, extends, uses)',
        enum: ['related_to', 'depends_on', 'implements', 'extends', 'uses', 'references', 'part_of']
      },
      strength: {
        type: 'number',
        description: '관계 강도 (0.0 ~ 1.0, 기본값: 1.0)',
        minimum: 0,
        maximum: 1
      },
      bidirectional: {
        type: 'boolean',
        description: '양방향 관계 여부 (기본값: false)'
      }
    },
    required: ['sourceKey', 'targetKey', 'relationType']
  },
  annotations: {
    title: 'Link Memories',
    audience: ['user', 'assistant'],
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

interface LinkMemoriesArgs {
  sourceKey: string;
  targetKey: string;
  relationType: string;
  strength?: number;
  bidirectional?: boolean;
}

export async function linkMemories(args: LinkMemoriesArgs): Promise<ToolResult> {
  try {
    const { sourceKey, targetKey, relationType, strength = 1.0, bidirectional = false } = args;
    const memoryManager = MemoryManager.getInstance();

    // Verify both memories exist
    const sourceMemory = memoryManager.recall(sourceKey);
    const targetMemory = memoryManager.recall(targetKey);

    if (!sourceMemory) {
      return {
        content: [{
          type: 'text',
          text: `✗ 소스 메모리를 찾을 수 없습니다: ${sourceKey}`
        }]
      };
    }

    if (!targetMemory) {
      return {
        content: [{
          type: 'text',
          text: `✗ 타겟 메모리를 찾을 수 없습니다: ${targetKey}`
        }]
      };
    }

    // Create the link
    const success = memoryManager.linkMemories(sourceKey, targetKey, relationType, strength);

    if (!success) {
      return {
        content: [{
          type: 'text',
          text: `✗ 관계 연결에 실패했습니다`
        }]
      };
    }

    // Create bidirectional link if requested
    if (bidirectional) {
      memoryManager.linkMemories(targetKey, sourceKey, relationType, strength);
    }

    const result = `✓ 메모리 관계가 연결되었습니다

**소스**: ${sourceKey}
**타겟**: ${targetKey}
**관계 유형**: ${relationType}
**강도**: ${strength}
**양방향**: ${bidirectional ? '예' : '아니오'}

이제 get_memory_graph로 관계를 시각화할 수 있습니다.`;

    return {
      content: [{
        type: 'text',
        text: result
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
