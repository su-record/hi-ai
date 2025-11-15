// Critical path tests for MemoryManager (v1.3)

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
    testDbPath = path.join(os.tmpdir(), `test-hi-ai-${Date.now()}.db`);
    // Force new instance with test path
    (MemoryManager as any).instance = null;
    manager = MemoryManager.getInstance(testDbPath);
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    (MemoryManager as any).instance = null;
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

  describe('JSON Migration (Critical)', () => {
    it('should create database if not exists', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should initialize with empty database', () => {
      const all = manager.list();
      expect(all.length).toBe(0);
    });
  });
});
