// Project caching utility for ts-morph (v1.3)
// Implements LRU cache to avoid re-parsing on every request

import { Project } from 'ts-morph';
import path from 'path';

interface CachedProject {
  project: Project;
  lastAccess: number;
  fileCount: number;
  estimatedMemoryMB: number;
}

export class ProjectCache {
  private static instance: ProjectCache | null = null;
  private cache = new Map<string, CachedProject>();
  private readonly MAX_CACHE_SIZE = 5;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_TOTAL_MEMORY_MB = 200; // Max 200MB total cache
  private readonly MAX_PROJECT_MEMORY_MB = 100; // Max 100MB per project

  private constructor() {}

  public static getInstance(): ProjectCache {
    if (!ProjectCache.instance) {
      ProjectCache.instance = new ProjectCache();
    }
    return ProjectCache.instance;
  }

  public getOrCreate(projectPath: string): Project {
    // Normalize path and remove trailing slashes
    let normalizedPath = path.normalize(projectPath);
    if (normalizedPath.endsWith(path.sep) && normalizedPath.length > 1) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    const now = Date.now();

    // Check if cached and not expired
    const cached = this.cache.get(normalizedPath);
    if (cached && (now - cached.lastAccess) < this.CACHE_TTL) {
      cached.lastAccess = now;
      return cached.project;
    }

    // Remove expired entries
    this.removeExpired();

    // LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }

    // Create new project
    const project = new Project({
      useInMemoryFileSystem: false,
      compilerOptions: {
        allowJs: true,
        skipLibCheck: true,
        noEmit: true
      }
    });

    // Add source files
    const pattern = path.join(normalizedPath, '**/*.{ts,tsx,js,jsx}');
    project.addSourceFilesAtPaths(pattern);

    const sourceFiles = project.getSourceFiles();
    const fileCount = sourceFiles.length;

    // Estimate memory usage (rough: 1MB base + 0.5MB per file)
    const estimatedMemoryMB = 1 + (fileCount * 0.5);

    // Skip caching if project is too large
    if (estimatedMemoryMB > this.MAX_PROJECT_MEMORY_MB) {
      console.warn(`Project ${normalizedPath} is too large (${estimatedMemoryMB}MB, ${fileCount} files) - not caching`);
      return project;
    }

    // Check total cache memory before adding
    const totalMemory = this.getTotalMemoryUsage();
    if (totalMemory + estimatedMemoryMB > this.MAX_TOTAL_MEMORY_MB) {
      // Evict projects until we have enough space
      while (this.getTotalMemoryUsage() + estimatedMemoryMB > this.MAX_TOTAL_MEMORY_MB && this.cache.size > 0) {
        this.evictLRU();
      }
    }

    this.cache.set(normalizedPath, {
      project,
      lastAccess: now,
      fileCount,
      estimatedMemoryMB
    });

    return project;
  }

  public invalidate(projectPath: string): void {
    const normalizedPath = path.normalize(projectPath);
    this.cache.delete(normalizedPath);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): { size: number; totalMemoryMB: number; projects: Array<{ path: string; files: number; memoryMB: number; age: number }> } {
    const now = Date.now();
    const projects = Array.from(this.cache.entries()).map(([path, cached]) => ({
      path,
      files: cached.fileCount,
      memoryMB: cached.estimatedMemoryMB,
      age: Math.floor((now - cached.lastAccess) / 1000) // seconds
    }));

    return {
      size: this.cache.size,
      totalMemoryMB: this.getTotalMemoryUsage(),
      projects
    };
  }

  private getTotalMemoryUsage(): number {
    let total = 0;
    this.cache.forEach(cached => {
      total += cached.estimatedMemoryMB;
    });
    return total;
  }

  private removeExpired(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.cache.forEach((cached, path) => {
      if ((now - cached.lastAccess) >= this.CACHE_TTL) {
        toRemove.push(path);
      }
    });

    toRemove.forEach(path => this.cache.delete(path));
  }

  private evictLRU(): void {
    let oldestPath: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((cached, path) => {
      if (cached.lastAccess < oldestTime) {
        oldestTime = cached.lastAccess;
        oldestPath = path;
      }
    });

    if (oldestPath) {
      this.cache.delete(oldestPath);
    }
  }
}
