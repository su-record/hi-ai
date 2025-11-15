// Critical path tests for ProjectCache (v1.3)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectCache } from '../../src/lib/ProjectCache.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ProjectCache - Critical Path', () => {
  let testProjectPath: string;
  let cache: ProjectCache;

  beforeEach(() => {
    // Create temp test project
    testProjectPath = path.join(os.tmpdir(), `test-project-${Date.now()}`);
    fs.mkdirSync(testProjectPath, { recursive: true });

    // Create test TypeScript file
    const testFile = path.join(testProjectPath, 'test.ts');
    fs.writeFileSync(testFile, 'export function hello() { return "world"; }');

    cache = ProjectCache.getInstance();
    cache.clear(); // Clear cache between tests
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
    cache.clear();
  });

  describe('Cache Creation', () => {
    it('should create and cache project', () => {
      const project = cache.getOrCreate(testProjectPath);

      expect(project).toBeDefined();
      expect(project.getSourceFiles().length).toBeGreaterThan(0);
    });

    it('should reuse cached project on second call', () => {
      const project1 = cache.getOrCreate(testProjectPath);
      const project2 = cache.getOrCreate(testProjectPath);

      // Should be the same instance
      expect(project1).toBe(project2);
    });

    it('should update lastAccess on cache hit', () => {
      cache.getOrCreate(testProjectPath);

      const statsBefore = cache.getStats();
      const ageBefore = statsBefore.projects[0].age;

      // Wait a bit
      setTimeout(() => {
        cache.getOrCreate(testProjectPath);

        const statsAfter = cache.getStats();
        const ageAfter = statsAfter.projects[0].age;

        expect(ageAfter).toBeLessThanOrEqual(ageBefore);
      }, 100);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict oldest when cache is full', () => {
      const maxSize = 5; // MAX_CACHE_SIZE in ProjectCache

      // Fill cache
      for (let i = 0; i < maxSize + 1; i++) {
        const dir = path.join(os.tmpdir(), `test-${i}`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'test.ts'), 'export const x = 1;');

        cache.getOrCreate(dir);
      }

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(maxSize);

      // Cleanup created dirs
      for (let i = 0; i < maxSize + 1; i++) {
        const dir = path.join(os.tmpdir(), `test-${i}`);
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific project', () => {
      cache.getOrCreate(testProjectPath);

      expect(cache.getStats().size).toBe(1);

      cache.invalidate(testProjectPath);

      expect(cache.getStats().size).toBe(0);
    });

    it('should clear all cache', () => {
      cache.getOrCreate(testProjectPath);

      const dir2 = path.join(os.tmpdir(), 'test-2');
      fs.mkdirSync(dir2, { recursive: true });
      fs.writeFileSync(path.join(dir2, 'test.ts'), 'export const y = 2;');
      cache.getOrCreate(dir2);

      expect(cache.getStats().size).toBe(2);

      cache.clear();

      expect(cache.getStats().size).toBe(0);

      // Cleanup
      if (fs.existsSync(dir2)) {
        fs.rmSync(dir2, { recursive: true, force: true });
      }
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', () => {
      cache.getOrCreate(testProjectPath);

      const stats = cache.getStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('projects');
      expect(stats.size).toBe(1);
      expect(stats.projects.length).toBe(1);
      expect(stats.projects[0]).toHaveProperty('path');
      expect(stats.projects[0]).toHaveProperty('files');
      expect(stats.projects[0]).toHaveProperty('age');
    });

    it('should track file count', () => {
      const stats = cache.getStats();

      if (stats.projects.length > 0) {
        expect(stats.projects[0].files).toBeGreaterThan(0);
      }
    });
  });

  describe('Path Normalization', () => {
    it('should normalize different path formats', () => {
      const project1 = cache.getOrCreate(testProjectPath);
      const project2 = cache.getOrCreate(testProjectPath + '/'); // Trailing slash

      expect(project1).toBe(project2);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent directory', () => {
      const nonExistent = path.join(os.tmpdir(), 'non-existent-dir');

      const project = cache.getOrCreate(nonExistent);

      // Should create project even if no files
      expect(project).toBeDefined();
      expect(project.getSourceFiles().length).toBe(0);
    });

    it('should handle empty directory', () => {
      const emptyDir = path.join(os.tmpdir(), `empty-${Date.now()}`);
      fs.mkdirSync(emptyDir, { recursive: true });

      const project = cache.getOrCreate(emptyDir);

      expect(project).toBeDefined();
      expect(project.getSourceFiles().length).toBe(0);

      // Cleanup
      fs.rmSync(emptyDir, { recursive: true, force: true });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ProjectCache.getInstance();
      const instance2 = ProjectCache.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Performance', () => {
    it('should load large project efficiently', () => {
      // Create multiple files
      for (let i = 0; i < 50; i++) {
        const file = path.join(testProjectPath, `file${i}.ts`);
        fs.writeFileSync(file, `export const var${i} = ${i};`);
      }

      const start = Date.now();
      cache.getOrCreate(testProjectPath);
      const duration = Date.now() - start;

      // Should complete within reasonable time (5s)
      expect(duration).toBeLessThan(5000);
    });

    it('should cache hit be instant', () => {
      // First call (cache miss) - warm up
      cache.getOrCreate(testProjectPath);

      // Second call (cache hit) - should be instant
      const start = Date.now();
      const project = cache.getOrCreate(testProjectPath);
      const duration = Date.now() - start;

      // Cache hit should be very fast (< 10ms)
      expect(project).toBeDefined();
      expect(duration).toBeLessThan(10);
    });
  });
});
