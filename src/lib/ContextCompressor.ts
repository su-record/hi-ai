// Context compression utility (v1.3)
// Intelligently compress context when approaching token limits

export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  removedSections: string[];
  retainedSections: string[];
}

export interface ChunkScore {
  text: string;
  score: number;
  type: 'code' | 'explanation' | 'question' | 'answer' | 'metadata';
  keywords: string[];
}

export class ContextCompressor {
  private static readonly MAX_CHUNK_SIZE = 500; // characters
  private static readonly CODE_KEYWORDS = [
    'function', 'class', 'const', 'let', 'var', 'import', 'export',
    'def', 'async', 'await', 'return', 'if', 'for', 'while'
  ];
  private static readonly IMPORTANT_KEYWORDS = [
    'error', 'bug', 'fix', 'issue', 'problem', 'solution',
    '에러', '버그', '수정', '문제', '해결', 'TODO', 'FIXME'
  ];

  /**
   * Compress context by selecting most important chunks
   */
  public static compress(
    context: string,
    targetTokens: number = 4000
  ): CompressionResult {
    // Handle empty or very short context
    if (!context || context.trim().length === 0) {
      return {
        compressed: '',
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        removedSections: [],
        retainedSections: []
      };
    }

    const chunks = this.splitIntoChunks(context);
    const scoredChunks = chunks.map(chunk => this.scoreChunk(chunk));

    // If content is already smaller than target, return as-is
    if (context.length <= targetTokens * 4) {
      return {
        compressed: context,
        originalSize: context.length,
        compressedSize: context.length,
        compressionRatio: 1,
        removedSections: [],
        retainedSections: scoredChunks.map(s => s.type)
      };
    }

    // Sort by score (highest first)
    scoredChunks.sort((a, b) => b.score - a.score);

    // Select chunks until target size
    const estimatedTokensPerChar = 0.25; // rough estimate: 1 token ≈ 4 chars
    const targetChars = targetTokens / estimatedTokensPerChar;

    const selected: ChunkScore[] = [];
    const removed: string[] = [];
    let currentSize = 0;

    for (const chunk of scoredChunks) {
      if (currentSize + chunk.text.length <= targetChars) {
        selected.push(chunk);
        currentSize += chunk.text.length;
      } else {
        removed.push(this.summarizeChunk(chunk));
      }
    }

    // Reconstruct compressed context
    const compressed = this.reconstructContext(selected, removed);

    return {
      compressed,
      originalSize: context.length,
      compressedSize: compressed.length,
      compressionRatio: compressed.length / context.length,
      removedSections: removed,
      retainedSections: selected.map(s => s.type)
    };
  }

  /**
   * Split context into manageable chunks
   */
  private static splitIntoChunks(context: string): string[] {
    const chunks: string[] = [];
    const lines = context.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length > this.MAX_CHUNK_SIZE) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = line;
      } else {
        currentChunk += '\n' + line;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Score chunk importance (0-100)
   */
  private static scoreChunk(text: string): ChunkScore {
    let score = 0;
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    // Detect chunk type
    let type: ChunkScore['type'] = 'explanation';
    if (this.CODE_KEYWORDS.some(kw => lowerText.includes(kw))) {
      type = 'code';
      score += 30; // Code is important
    }
    if (lowerText.includes('?')) {
      type = 'question';
      score += 25; // Questions are important
    }
    if (lowerText.match(/^(answer|solution|결과|답변):/i)) {
      type = 'answer';
      score += 35; // Answers are very important
    }

    // Check for important keywords
    for (const keyword of this.IMPORTANT_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 15;
        keywords.push(keyword);
      }
    }

    // Check for code blocks
    if (text.includes('```')) {
      score += 20;
      type = 'code';
    }

    // Penalize very long chunks (might be verbose)
    if (text.length > 1000) {
      score -= 10;
    }

    // Boost short, concise chunks
    if (text.length < 200 && text.split('\n').length <= 5) {
      score += 10;
    }

    // Detect numbered lists or bullet points (structured info)
    if (text.match(/^[\d\-\*•]/m)) {
      score += 15;
    }

    // Metadata has lowest priority
    if (lowerText.match(/^(timestamp|date|author|file):/i)) {
      type = 'metadata';
      score -= 20;
    }

    return {
      text,
      score: Math.max(0, Math.min(100, score)),
      type,
      keywords
    };
  }

  /**
   * Summarize removed chunk (one-liner)
   */
  private static summarizeChunk(chunk: ChunkScore): string {
    const firstLine = chunk.text.split('\n')[0].trim();
    const summary = firstLine.length > 80
      ? firstLine.substring(0, 77) + '...'
      : firstLine;

    return `[${chunk.type}] ${summary}`;
  }

  /**
   * Reconstruct compressed context
   */
  private static reconstructContext(
    selected: ChunkScore[],
    removed: string[]
  ): string {
    // Group by type for better organization
    const byType: Record<string, ChunkScore[]> = {
      code: [],
      answer: [],
      question: [],
      explanation: [],
      metadata: []
    };

    selected.forEach(chunk => {
      byType[chunk.type].push(chunk);
    });

    const sections: string[] = [];

    // Add header
    sections.push('[Compressed Context - High Priority Information]\n');

    // Add answers first (most important)
    if (byType.answer.length > 0) {
      sections.push('## Key Answers & Solutions');
      sections.push(byType.answer.map(c => c.text).join('\n\n'));
      sections.push('');
    }

    // Add code blocks
    if (byType.code.length > 0) {
      sections.push('## Code Snippets');
      sections.push(byType.code.map(c => c.text).join('\n\n'));
      sections.push('');
    }

    // Add questions
    if (byType.question.length > 0) {
      sections.push('## Questions');
      sections.push(byType.question.map(c => c.text).join('\n\n'));
      sections.push('');
    }

    // Add explanations
    if (byType.explanation.length > 0) {
      sections.push('## Context');
      sections.push(byType.explanation.map(c => c.text).join('\n\n'));
      sections.push('');
    }

    // Add summary of removed sections
    if (removed.length > 0) {
      sections.push('## Removed Sections (Low Priority)');
      sections.push(removed.join('\n'));
    }

    return sections.join('\n');
  }

  /**
   * Extract key entities (names, numbers, dates) from context
   */
  public static extractKeyEntities(context: string): {
    names: string[];
    numbers: string[];
    dates: string[];
    files: string[];
  } {
    const names = Array.from(
      new Set(
        context.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
      )
    );

    const numbers = Array.from(
      new Set(
        context.match(/\b\d+(?:\.\d+)?\b/g) || []
      )
    );

    const dates = Array.from(
      new Set(
        context.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/g) || []
      )
    );

    const files = Array.from(
      new Set(
        context.match(/[\w\-]+\.[a-z]{2,4}\b/gi) || []
      )
    );

    return { names, numbers, dates, files };
  }

  /**
   * Estimate token count (rough approximation)
   */
  public static estimateTokens(text: string): number {
    // GPT-like tokenization: ~1 token per 4 characters
    // More accurate would require actual tokenizer
    return Math.ceil(text.length / 4);
  }
}
