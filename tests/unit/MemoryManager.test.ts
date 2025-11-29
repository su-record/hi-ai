// Critical path tests for MemoryManager (v2.0)
// Includes Knowledge Graph tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../../src/lib/MemoryManager.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('MemoryManager - Critical Path', () => {
  let testDbPath: string;
  let manager: MemoryManager;

  beforeEach(() => {
    // Use temp directory for test database
    testDbPath = path.join(os.tmpdir(), `test-hi-ai-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    // Force new instance with test path
    (MemoryManager as any).instance = null;
    manager = MemoryManager.getInstance(testDbPath);
  });

  afterEach(() => {
    // Close database connection first
    try {
      manager.close();
    } catch (e) {
      // Ignore close errors
    }
    (MemoryManager as any).instance = null;

    // Wait a bit for Windows file handles to release
    setTimeout(() => {
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
        // Also clean up WAL files
        if (fs.existsSync(testDbPath + '-wal')) {
          fs.unlinkSync(testDbPath + '-wal');
        }
        if (fs.existsSync(testDbPath + '-shm')) {
          fs.unlinkSync(testDbPath + '-shm');
        }
      } catch (e) {
        // Ignore cleanup errors on Windows
      }
    }, 100);
  });

  describe('CRUD Operations', () => {
    it('should save and recall memory', () => {
      manager.save('test-key', 'test-value', 'general', 0);
      const memory = manager.recall('test-key');

      expect(memory).toBeDefined();
      expect(memory?.key).toBe('test-key');
      expect(memory?.value).toBe('test-value');
      expect(memory?.category).toBe('general');
    });

    it('should update existing memory', () => {
      manager.save('key1', 'value1', 'general', 0);
      manager.save('key1', 'value2', 'general', 0);

      const memory = manager.recall('key1');
      expect(memory?.value).toBe('value2');
    });

    it('should delete memory', () => {
      manager.save('key1', 'value1', 'general', 0);
      manager.delete('key1');

      const memory = manager.recall('key1');
      expect(memory).toBeNull();
    });

    it('should list all memories', () => {
      manager.save('key1', 'value1', 'project', 0);
      manager.save('key2', 'value2', 'personal', 0);
      manager.save('key3', 'value3', 'project', 0);

      const all = manager.list();
      expect(all.length).toBe(3);
    });

    it('should filter by category', () => {
      manager.save('key1', 'value1', 'project', 0);
      manager.save('key2', 'value2', 'personal', 0);
      manager.save('key3', 'value3', 'project', 0);

      const projectMemories = manager.list('project');
      expect(projectMemories.length).toBe(2);
      expect(projectMemories.every(m => m.category === 'project')).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('should search by keyword in value', () => {
      manager.save('key1', 'hello world', 'general', 0);
      manager.save('key2', 'foo bar', 'general', 0);
      manager.save('key3', 'world peace', 'general', 0);

      const results = manager.search('world');
      expect(results.length).toBe(2);
      expect(results.every(m => m.value.includes('world'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      manager.save('key1', 'hello', 'general', 0);

      const results = manager.search('nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('Priority Handling', () => {
    it('should retrieve high priority memories', () => {
      manager.save('key1', 'value1', 'general', 0);
      manager.save('key2', 'value2', 'general', 2);
      manager.save('key3', 'value3', 'general', 1);

      const highPriority = manager.getByPriority(2);
      expect(highPriority.length).toBe(1);
      expect(highPriority[0].priority).toBe(2);
    });

    it('should update priority', () => {
      manager.save('key1', 'value1', 'general', 0);
      manager.setPriority('key1', 2);

      const memory = manager.recall('key1');
      expect(memory?.priority).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should return null for non-existent key', () => {
      const memory = manager.recall('nonexistent');
      expect(memory).toBeNull();
    });

    it('should handle special characters in values', () => {
      const specialValue = 'Test "quotes" and \'apostrophes\' and \\ backslash';
      manager.save('special', specialValue, 'general', 0);

      const memory = manager.recall('special');
      expect(memory?.value).toBe(specialValue);
    });

    it('should handle large values', () => {
      const largeValue = 'x'.repeat(10000);
      manager.save('large', largeValue, 'general', 0);

      const memory = manager.recall('large');
      expect(memory?.value).toBe(largeValue);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple rapid writes', () => {
      for (let i = 0; i < 100; i++) {
        manager.save(`key${i}`, `value${i}`, 'general', 0);
      }

      const all = manager.list();
      expect(all.length).toBe(100);
    });

    it('should handle interleaved read/write', () => {
      manager.save('key1', 'value1', 'general', 0);
      const read1 = manager.recall('key1');
      manager.save('key2', 'value2', 'general', 0);
      const read2 = manager.recall('key2');

      expect(read1?.value).toBe('value1');
      expect(read2?.value).toBe('value2');
    });
  });

  describe('Database Initialization', () => {
    it('should create database if not exists', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should initialize with empty database', () => {
      const all = manager.list();
      expect(all.length).toBe(0);
    });
  });

  // v2.0 Knowledge Graph Tests
  describe('Knowledge Graph - Link Memories', () => {
    it('should link two memories', () => {
      manager.save('source', 'source value', 'general', 0);
      manager.save('target', 'target value', 'general', 0);

      const result = manager.linkMemories('source', 'target', 'related_to', 0.8);
      expect(result).toBe(true);
    });

    it('should get relations for a memory', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('a', 'c', 'depends_on', 0.5);

      const relations = manager.getRelations('a', 'outgoing');
      expect(relations.length).toBe(2);
      expect(relations.some(r => r.targetKey === 'b')).toBe(true);
      expect(relations.some(r => r.targetKey === 'c')).toBe(true);
    });

    it('should get incoming relations', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);

      const relations = manager.getRelations('b', 'incoming');
      expect(relations.length).toBe(1);
      expect(relations[0].sourceKey).toBe('a');
    });

    it('should unlink memories', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      const unlinkResult = manager.unlinkMemories('a', 'b', 'related_to');

      expect(unlinkResult).toBe(true);

      const relations = manager.getRelations('a', 'outgoing');
      expect(relations.length).toBe(0);
    });

    it('should delete relations when memory is deleted', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.delete('a');

      const relations = manager.getRelations('b', 'both');
      expect(relations.length).toBe(0);
    });
  });

  describe('Knowledge Graph - Graph Traversal', () => {
    it('should get related memories with depth 1', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('b', 'c', 'related_to', 1.0);

      const related = manager.getRelatedMemories('a', 1);
      expect(related.length).toBe(1);
      expect(related[0].key).toBe('b');
    });

    it('should get related memories with depth 2', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('b', 'c', 'related_to', 1.0);

      const related = manager.getRelatedMemories('a', 2);
      expect(related.length).toBe(2);
      expect(related.some(m => m.key === 'b')).toBe(true);
      expect(related.some(m => m.key === 'c')).toBe(true);
    });

    it('should filter by relation type', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('a', 'c', 'depends_on', 1.0);

      const related = manager.getRelatedMemories('a', 1, 'related_to');
      expect(related.length).toBe(1);
      expect(related[0].key).toBe('b');
    });
  });

  describe('Knowledge Graph - Memory Graph', () => {
    it('should get memory graph structure', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('b', 'c', 'related_to', 1.0);

      const graph = manager.getMemoryGraph('a', 2);

      expect(graph.nodes.length).toBe(3);
      expect(graph.edges.length).toBe(2);
    });

    it('should detect clusters', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);
      manager.save('d', 'value d', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('c', 'd', 'related_to', 1.0);

      const graph = manager.getMemoryGraph();

      // Two separate clusters
      expect(graph.clusters.length).toBe(2);
    });

    it('should find path between memories', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      manager.linkMemories('a', 'b', 'related_to', 1.0);
      manager.linkMemories('b', 'c', 'related_to', 1.0);

      const path = manager.findPath('a', 'c');

      expect(path).not.toBeNull();
      expect(path?.length).toBe(3);
      expect(path?.[0]).toBe('a');
      expect(path?.[1]).toBe('b');
      expect(path?.[2]).toBe('c');
    });

    it('should return null when no path exists', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);

      // No link between a and b

      const path = manager.findPath('a', 'b');
      expect(path).toBeNull();
    });
  });

  describe('Knowledge Graph - Timeline', () => {
    it('should get timeline', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      const timeline = manager.getTimeline();

      expect(timeline.length).toBe(3);
      // Most recent first
      expect(timeline[0].key).toBe('c');
    });

    it('should limit timeline results', () => {
      manager.save('a', 'value a', 'general', 0);
      manager.save('b', 'value b', 'general', 0);
      manager.save('c', 'value c', 'general', 0);

      const timeline = manager.getTimeline(undefined, undefined, 2);

      expect(timeline.length).toBe(2);
    });
  });

  describe('Knowledge Graph - Advanced Search', () => {
    it('should search with keyword strategy', () => {
      manager.save('auth', 'authentication logic', 'general', 0);
      manager.save('user', 'user management', 'general', 0);
      manager.save('auth-token', 'auth token handling', 'general', 0);

      const results = manager.searchAdvanced('auth', 'keyword', { limit: 10 });

      expect(results.length).toBe(2);
    });

    it('should search with temporal strategy', () => {
      manager.save('old', 'old value', 'general', 0);
      manager.save('new', 'new value', 'general', 0);

      const results = manager.searchAdvanced('value', 'temporal', { limit: 10 });

      // Most recent first
      expect(results[0].key).toBe('new');
    });

    it('should search with priority strategy', () => {
      manager.save('low', 'test value', 'general', 0);
      manager.save('high', 'test value', 'general', 5);

      const results = manager.searchAdvanced('test', 'priority', { limit: 10 });

      // Highest priority first
      expect(results[0].key).toBe('high');
    });

    it('should search with context_aware strategy', () => {
      manager.save('auth', 'authentication', 'general', 5);
      manager.save('other', 'authentication related', 'general', 0);

      const results = manager.searchAdvanced('auth', 'context_aware', { limit: 10 });

      // Key match + high priority should rank first
      expect(results[0].key).toBe('auth');
    });

    it('should filter by category in advanced search', () => {
      manager.save('a', 'test value', 'project', 0);
      manager.save('b', 'test value', 'personal', 0);

      const results = manager.searchAdvanced('test', 'keyword', { category: 'project' });

      expect(results.length).toBe(1);
      expect(results[0].category).toBe('project');
    });
  });

  describe('Statistics', () => {
    it('should return correct stats', () => {
      manager.save('a', 'value', 'project', 0);
      manager.save('b', 'value', 'project', 0);
      manager.save('c', 'value', 'personal', 0);

      const stats = manager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byCategory['project']).toBe(2);
      expect(stats.byCategory['personal']).toBe(1);
    });
  });
});
