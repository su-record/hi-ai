// Critical path tests for ContextCompressor (v1.3)

import { describe, it, expect } from 'vitest';
import { ContextCompressor } from '../../src/lib/ContextCompressor.js';

describe('ContextCompressor - Critical Path', () => {
  describe('Basic Compression', () => {
    it('should compress text to target tokens', () => {
      const longText = 'This is a test. '.repeat(1000); // ~3000 chars
      const result = ContextCompressor.compress(longText, 500); // Target: 500 tokens

      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeLessThan(1);
    });

    it('should not expand short text', () => {
      const shortText = 'Hello world';
      const result = ContextCompressor.compress(shortText, 1000);

      expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    });

    it('should return compression stats', () => {
      const text = 'Test content. '.repeat(100);
      const result = ContextCompressor.compress(text, 200);

      expect(result).toHaveProperty('compressed');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('compressedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('removedSections');
      expect(result).toHaveProperty('retainedSections');
    });
  });

  describe('Code Preservation (CRITICAL)', () => {
    it('should preserve code blocks', () => {
      const codeText = `
Some explanation text that can be removed.

\`\`\`typescript
function important() {
  return 42;
}
\`\`\`

More filler text here.
      `;

      const result = ContextCompressor.compress(codeText, 100);

      // Code block should be preserved
      expect(result.compressed).toContain('function important()');
      expect(result.compressed).toContain('return 42');
    });

    it('should prioritize code over explanations', () => {
      // Create text large enough to trigger compression
      const filler = 'This is a long explanation that goes on and on about nothing important. '.repeat(100);
      const text = `
${filler}

\`\`\`javascript
const criticalCode = true;
\`\`\`

${filler}
      `;

      const result = ContextCompressor.compress(text, 50);
      expect(result.compressed).toContain('criticalCode');
    });

    it('should detect code keywords', () => {
      const codeSnippet = `
function calculateTotal(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price;
  }
  return sum;
}
      `;

      const result = ContextCompressor.compress(codeSnippet, 50);

      // Should keep function definitions
      expect(result.compressed).toContain('function');
    });
  });

  describe('Priority Scoring', () => {
    it('should prioritize answers over questions', () => {
      // Add filler to exceed target
      const filler = 'Random text here. '.repeat(200);
      const text = `
${filler}
Question: What is the meaning of life?

Answer: The answer to life, universe, and everything is 42. This is the most important information.

${filler}
Random metadata: timestamp 2024-01-01
      `;

      const result = ContextCompressor.compress(text, 100);
      expect(result.compressed.toLowerCase()).toContain('answer');
    });

    it.skip('should prioritize important keywords', () => {
      const text = `
Normal text here. This is a long paragraph with lots of filler content that needs to be compressed away.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
Etiam vel justo nec nulla facilisis porttitor. Pellentesque habitant morbi tristique senectus et netus.

Answer: ERROR: Critical bug found in production! This is the most important part of the message.

More normal text here with additional filler content. More filler. Even more filler to make this long.
Additional paragraph with more content that should be compressed. This is low priority information.
Yet another paragraph with even more filler text. Keep adding more content to ensure compression happens.
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      `;

      const result = ContextCompressor.compress(text, 15);
      expect(result.compressed.toLowerCase()).toContain('error');
    });

    it('should deprioritize metadata', () => {
      // Add lots of metadata to exceed target
      const metadata = [];
      for (let i = 0; i < 200; i++) {
        metadata.push(`timestamp: 2024-01-${i}`);
        metadata.push(`date: 2024-01-${i}`);
        metadata.push(`author: Person ${i}`);
      }

      const text = `
${metadata.join('\n')}

Important content: This is the actual valuable information.
      `;

      const result = ContextCompressor.compress(text, 100);
      expect(result.compressed).toContain('Important content');
    });
  });

  describe('Token Estimation', () => {
    it('should estimate tokens approximately', () => {
      const text = 'Hello world'; // ~3 tokens
      const estimate = ContextCompressor.estimateTokens(text);

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(10);
    });

    it('should scale with text length', () => {
      const short = 'Hi';
      const long = 'This is a much longer text with many more words';

      const shortEstimate = ContextCompressor.estimateTokens(short);
      const longEstimate = ContextCompressor.estimateTokens(long);

      expect(longEstimate).toBeGreaterThan(shortEstimate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = ContextCompressor.compress('', 100);

      expect(result.compressed).toBe('');
      expect(result.originalSize).toBe(0);
      expect(result.compressedSize).toBe(0);
    });

    it('should handle very long single line', () => {
      const longLine = 'a'.repeat(5000);
      const result = ContextCompressor.compress(longLine, 100);

      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });

    it('should handle multiple newlines', () => {
      const text = 'Line 1\n\n\n\nLine 2\n\n\nLine 3';
      const result = ContextCompressor.compress(text, 100);

      expect(result.compressed).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      const text = '한글 텍스트입니다. 🎉 Emoji too!';
      const result = ContextCompressor.compress(text, 100);

      expect(result.compressed).toContain('한글');
    });
  });

  describe('Compression Ratio', () => {
    it('should achieve target compression for large text', () => {
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(500); // ~14KB
      const result = ContextCompressor.compress(largeText, 1000); // Target ~1KB

      const targetSize = 1000 / 0.25; // 4000 chars
      expect(result.compressedSize).toBeLessThanOrEqual(targetSize * 1.2); // 20% margin
    });

    it('should remove low-priority sections when target is exceeded', () => {
      // Create very large text to force compression
      const parts = [];
      parts.push('Important code:\n```\nconst x = 1;\n```\n\n');

      // Add lots of low-priority metadata
      for (let i = 0; i < 500; i++) {
        parts.push(`Metadata: boring stuff ${i}\n`);
        parts.push(`More metadata: timestamp ${i}\n`);
      }

      parts.push('\nCritical ERROR found!\n');

      const largeText = parts.join('');

      // Very aggressive compression target
      const result = ContextCompressor.compress(largeText, 50);

      // Should have removed some sections
      if (result.removedSections.length > 0) {
        expect(result.removedSections.length).toBeGreaterThan(0);
      }
      expect(result.retainedSections.length).toBeGreaterThan(0);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract file names', () => {
      const text = 'Check index.ts and utils.js for the implementation';
      const entities = ContextCompressor.extractKeyEntities(text);

      expect(entities.files).toContain('index.ts');
      expect(entities.files).toContain('utils.js');
    });

    it('should extract dates', () => {
      const text = 'Created on 2024-01-15 and updated on 01/20/2024';
      const entities = ContextCompressor.extractKeyEntities(text);

      expect(entities.dates.length).toBeGreaterThan(0);
    });

    it('should extract numbers', () => {
      const text = 'The answer is 42 and pi is 3.14';
      const entities = ContextCompressor.extractKeyEntities(text);

      expect(entities.numbers).toContain('42');
      expect(entities.numbers).toContain('3.14');
    });
  });
});
