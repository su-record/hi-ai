// SQLite-based memory management system with Knowledge Graph support (v2.0)
// Replaces JSON file storage with proper database

import Database from 'better-sqlite3';
import path from 'path';
import { promises as fs } from 'fs';
import { MemoryRelation, MemoryGraph, MemoryGraphNode } from '../types/tool.js';

export interface MemoryItem {
  key: string;
  value: string;
  category: string;
  timestamp: string;
  lastAccessed: string;
  priority?: number;
}

export class MemoryManager {
  private db: Database.Database;
  private static instance: MemoryManager | null = null;
  private readonly dbPath: string;
  private recallStmt: Database.Statement | null = null;
  private saveStmt: Database.Statement | null = null;
  private recallSelectStmt: Database.Statement | null = null;
  private recallUpdateStmt: Database.Statement | null = null;

  private constructor(customDbPath?: string) {
    if (customDbPath) {
      this.dbPath = customDbPath;
    } else {
      const memoryDir = path.join(process.cwd(), 'memories');
      this.dbPath = path.join(memoryDir, 'memories.db');

      // Ensure directory exists synchronously (needed for DB init)
      try {
        require('fs').mkdirSync(memoryDir, { recursive: true });
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code !== 'EEXIST') {
          throw new Error(`Failed to create memory directory: ${nodeError.message}`);
        }
      }
    }

    this.db = new Database(this.dbPath);
    this.initializeDatabase();

    // Only migrate if using default path (not for tests)
    if (!customDbPath) {
      this.migrateFromJSON();
    }
  }

  private static cleanupRegistered = false;

  public static getInstance(customDbPath?: string): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(customDbPath);

      // Register cleanup handlers only once
      if (!MemoryManager.cleanupRegistered) {
        MemoryManager.cleanupRegistered = true;

        // Increase max listeners to avoid warnings in test environments
        process.setMaxListeners(Math.max(process.getMaxListeners(), 15));

        // Register cleanup on process exit to prevent memory leaks
        const cleanup = () => {
          if (MemoryManager.instance) {
            MemoryManager.instance.close();
          }
        };

        process.on('exit', cleanup);
        process.on('SIGINT', () => {
          cleanup();
          process.exit(0);
        });
        process.on('SIGTERM', () => {
          cleanup();
          process.exit(0);
        });
      }
    }
    return MemoryManager.instance;
  }

  private initializeDatabase(): void {
    // Create memories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        timestamp TEXT NOT NULL,
        lastAccessed TEXT NOT NULL,
        priority INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp);
      CREATE INDEX IF NOT EXISTS idx_priority ON memories(priority);
      CREATE INDEX IF NOT EXISTS idx_lastAccessed ON memories(lastAccessed);
    `);

    // v2.0: Create memory_relations table for Knowledge Graph
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceKey TEXT NOT NULL,
        targetKey TEXT NOT NULL,
        relationType TEXT NOT NULL,
        strength REAL DEFAULT 1.0,
        metadata TEXT,
        timestamp TEXT NOT NULL,
        UNIQUE(sourceKey, targetKey, relationType)
      );

      CREATE INDEX IF NOT EXISTS idx_rel_source ON memory_relations(sourceKey);
      CREATE INDEX IF NOT EXISTS idx_rel_target ON memory_relations(targetKey);
      CREATE INDEX IF NOT EXISTS idx_rel_type ON memory_relations(relationType);
    `);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Pre-compile frequently used statements for performance
    this.initializePreparedStatements();
  }

  private initializePreparedStatements(): void {
    // Pre-compile recall statement
    try {
      this.recallStmt = this.db.prepare(`
        UPDATE memories SET lastAccessed = ?
        WHERE key = ?
        RETURNING *
      `);
    } catch (error) {
      // RETURNING not supported, pre-compile fallback statements
      this.recallStmt = null;
      this.recallSelectStmt = this.db.prepare(`SELECT * FROM memories WHERE key = ?`);
      this.recallUpdateStmt = this.db.prepare(`UPDATE memories SET lastAccessed = ? WHERE key = ?`);
    }

    // Pre-compile save statement
    this.saveStmt = this.db.prepare(`
      INSERT OR REPLACE INTO memories (key, value, category, timestamp, lastAccessed, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
  }

  /**
   * Auto-migrate from JSON to SQLite database
   */
  private migrateFromJSON(): void {
    const jsonPath = this.getJSONPath();
    const memories = this.loadJSONMemories(jsonPath);

    if (memories.length === 0) return;

    this.importMemories(memories);
    this.backupAndCleanup(jsonPath, memories.length);
  }

  /**
   * Get JSON file path
   */
  private getJSONPath(): string {
    return path.join(path.dirname(this.dbPath), 'memories.json');
  }

  /**
   * Load memories from JSON file
   */
  private loadJSONMemories(jsonPath: string): MemoryItem[] {
    try {
      const jsonData = require('fs').readFileSync(jsonPath, 'utf-8');
      return JSON.parse(jsonData);
    } catch (error) {
      return [];
    }
  }

  /**
   * Import memories into SQLite database
   */
  private importMemories(memories: MemoryItem[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO memories (key, value, category, timestamp, lastAccessed, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items: MemoryItem[]) => {
      for (const item of items) {
        insert.run(
          item.key,
          item.value,
          item.category || 'general',
          item.timestamp,
          item.lastAccessed,
          item.priority || 0
        );
      }
    });

    insertMany(memories);
  }

  /**
   * Backup JSON file and log migration
   */
  private backupAndCleanup(jsonPath: string, count: number): void {
    try {
      require('fs').renameSync(jsonPath, `${jsonPath}.backup`);
      // Migration successful - could add logger here
    } catch (error) {
      // Backup failed but migration completed
    }
  }

  /**
   * Save or update a memory item
   * @param key - Unique identifier for the memory
   * @param value - Content to store
   * @param category - Category for organization (default: 'general')
   * @param priority - Priority level (default: 0)
   */
  public save(key: string, value: string, category: string = 'general', priority: number = 0): void {
    const timestamp = new Date().toISOString();

    if (this.saveStmt) {
      this.saveStmt.run(key, value, category, timestamp, timestamp, priority);
    } else {
      // Fallback if prepared statement not available
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO memories (key, value, category, timestamp, lastAccessed, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(key, value, category, timestamp, timestamp, priority);
    }
  }

  /**
   * Recall a memory item by key
   * @param key - Memory key to recall
   * @returns Memory item or null if not found
   */
  public recall(key: string): MemoryItem | null {
    const timestamp = new Date().toISOString();

    // Use pre-compiled statement if available
    if (this.recallStmt) {
      const result = this.recallStmt.get(timestamp, key) as MemoryItem | undefined;
      return result || null;
    }

    // Fallback for older SQLite versions (using pre-compiled statements)
    if (!this.recallSelectStmt || !this.recallUpdateStmt) {
      throw new Error('Fallback recall statements not initialized');
    }

    const result = this.recallSelectStmt.get(key) as MemoryItem | undefined;

    if (result) {
      this.recallUpdateStmt.run(timestamp, key);
    }

    return result || null;
  }

  /**
   * Delete a memory item
   * @param key - Memory key to delete
   * @returns True if deleted successfully
   */
  public delete(key: string): boolean {
    // Also delete related relations
    this.db.prepare(`DELETE FROM memory_relations WHERE sourceKey = ? OR targetKey = ?`).run(key, key);

    const stmt = this.db.prepare(`
      DELETE FROM memories WHERE key = ?
    `);

    const result = stmt.run(key);
    return result.changes > 0;
  }

  /**
   * Update a memory item's value
   * @param key - Memory key to update
   * @param value - New value
   * @returns True if updated successfully
   */
  public update(key: string, value: string): boolean {
    const timestamp = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE memories
      SET value = ?, timestamp = ?, lastAccessed = ?
      WHERE key = ?
    `);

    const result = stmt.run(value, timestamp, timestamp, key);
    return result.changes > 0;
  }

  /**
   * List all memories or filter by category
   * @param category - Optional category filter
   * @returns Array of memory items
   */
  public list(category?: string): MemoryItem[] {
    let stmt;

    if (category) {
      stmt = this.db.prepare(`
        SELECT * FROM memories WHERE category = ?
        ORDER BY priority DESC, timestamp DESC
      `);
      return stmt.all(category) as MemoryItem[];
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM memories
        ORDER BY priority DESC, timestamp DESC
      `);
      return stmt.all() as MemoryItem[];
    }
  }

  /**
   * Search memories by keyword
   * @param query - Search query string
   * @returns Array of matching memory items
   */
  public search(query: string): MemoryItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE key LIKE ? OR value LIKE ?
      ORDER BY priority DESC, timestamp DESC
    `);

    const pattern = `%${query}%`;
    return stmt.all(pattern, pattern) as MemoryItem[];
  }

  /**
   * Get memories by priority level
   * @param priority - Priority level to filter
   * @returns Array of memory items with specified priority
   */
  public getByPriority(priority: number): MemoryItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories
      WHERE priority = ?
      ORDER BY timestamp DESC
    `);

    return stmt.all(priority) as MemoryItem[];
  }

  /**
   * Update priority of a memory item
   * @param key - Memory key
   * @param priority - New priority level
   * @returns True if updated successfully
   */
  public setPriority(key: string, priority: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE memories SET priority = ? WHERE key = ?
    `);

    const result = stmt.run(priority, key);
    return result.changes > 0;
  }

  /**
   * Get memory statistics (optimized to single query)
   * @returns Total count and count by category
   */
  public getStats(): { total: number; byCategory: Record<string, number> } {
    // Single query with ROLLUP or combined approach
    const categories = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM memories
      GROUP BY category
    `).all() as Array<{ category: string; count: number }>;

    const byCategory: Record<string, number> = {};
    let total = 0;

    categories.forEach(cat => {
      byCategory[cat.category] = cat.count;
      total += cat.count;
    });

    return { total, byCategory };
  }

  // ============================================================================
  // v2.0 - Knowledge Graph Methods
  // ============================================================================

  /**
   * Link two memories with a relationship
   * @param sourceKey - Source memory key
   * @param targetKey - Target memory key
   * @param relationType - Type of relationship (e.g., 'related_to', 'depends_on', 'implements')
   * @param strength - Relationship strength (0.0 to 1.0)
   * @param metadata - Optional additional data
   */
  public linkMemories(
    sourceKey: string,
    targetKey: string,
    relationType: string,
    strength: number = 1.0,
    metadata?: Record<string, any>
  ): boolean {
    const timestamp = new Date().toISOString();
    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO memory_relations
        (sourceKey, targetKey, relationType, strength, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(sourceKey, targetKey, relationType, strength, metadataJson, timestamp);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all relations for a memory
   * @param key - Memory key
   * @param direction - 'outgoing', 'incoming', or 'both'
   */
  public getRelations(key: string, direction: 'outgoing' | 'incoming' | 'both' = 'both'): MemoryRelation[] {
    let sql = '';

    if (direction === 'outgoing') {
      sql = `SELECT * FROM memory_relations WHERE sourceKey = ?`;
    } else if (direction === 'incoming') {
      sql = `SELECT * FROM memory_relations WHERE targetKey = ?`;
    } else {
      sql = `SELECT * FROM memory_relations WHERE sourceKey = ? OR targetKey = ?`;
    }

    const stmt = this.db.prepare(sql);
    const rows = direction === 'both'
      ? stmt.all(key, key) as any[]
      : stmt.all(key) as any[];

    return rows.map(row => ({
      sourceKey: row.sourceKey,
      targetKey: row.targetKey,
      relationType: row.relationType,
      strength: row.strength,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: row.timestamp
    }));
  }

  /**
   * Get related memories using graph traversal
   * @param key - Starting memory key
   * @param depth - How many levels to traverse
   * @param relationType - Optional filter by relation type
   */
  public getRelatedMemories(
    key: string,
    depth: number = 1,
    relationType?: string
  ): MemoryItem[] {
    const visited = new Set<string>([key]);
    const result: MemoryItem[] = [];
    let currentLevel = [key];

    for (let d = 0; d < depth; d++) {
      const nextLevel: string[] = [];

      for (const currentKey of currentLevel) {
        const relations = this.getRelations(currentKey, 'both');

        for (const rel of relations) {
          if (relationType && rel.relationType !== relationType) continue;

          const neighborKey = rel.sourceKey === currentKey ? rel.targetKey : rel.sourceKey;

          if (!visited.has(neighborKey)) {
            visited.add(neighborKey);
            nextLevel.push(neighborKey);

            const memory = this.recall(neighborKey);
            if (memory) {
              result.push(memory);
            }
          }
        }
      }

      currentLevel = nextLevel;
      if (currentLevel.length === 0) break;
    }

    return result;
  }

  /**
   * Get memory graph structure
   * @param key - Starting memory key (optional, if not provided returns entire graph)
   * @param depth - Traversal depth
   */
  public getMemoryGraph(key?: string, depth: number = 2): MemoryGraph {
    const nodes: MemoryGraphNode[] = [];
    const edges: MemoryRelation[] = [];
    const visited = new Set<string>();

    if (key) {
      // BFS from starting key
      this.buildGraphFromKey(key, depth, visited, nodes, edges);
    } else {
      // Get all memories and relations
      const allMemories = this.list();
      for (const memory of allMemories) {
        const relations = this.getRelations(memory.key, 'outgoing');
        nodes.push({
          key: memory.key,
          value: memory.value,
          category: memory.category,
          relations
        });
        edges.push(...relations);
      }
    }

    // Detect clusters using simple connected components
    const clusters = this.detectClusters(nodes, edges);

    return { nodes, edges, clusters };
  }

  private buildGraphFromKey(
    startKey: string,
    depth: number,
    visited: Set<string>,
    nodes: MemoryGraphNode[],
    edges: MemoryRelation[]
  ): void {
    const queue: Array<{ key: string; level: number }> = [{ key: startKey, level: 0 }];

    while (queue.length > 0) {
      const { key, level } = queue.shift()!;

      if (visited.has(key) || level > depth) continue;
      visited.add(key);

      const memory = this.recall(key);
      if (!memory) continue;

      const relations = this.getRelations(key, 'both');
      nodes.push({
        key: memory.key,
        value: memory.value,
        category: memory.category,
        relations
      });

      for (const rel of relations) {
        if (!edges.some(e =>
          e.sourceKey === rel.sourceKey &&
          e.targetKey === rel.targetKey &&
          e.relationType === rel.relationType
        )) {
          edges.push(rel);
        }

        const neighborKey = rel.sourceKey === key ? rel.targetKey : rel.sourceKey;
        if (!visited.has(neighborKey) && level < depth) {
          queue.push({ key: neighborKey, level: level + 1 });
        }
      }
    }
  }

  private detectClusters(nodes: MemoryGraphNode[], edges: MemoryRelation[]): string[][] {
    const parent: Record<string, string> = {};

    // Initialize each node as its own parent
    for (const node of nodes) {
      parent[node.key] = node.key;
    }

    // Find with path compression
    const find = (x: string): string => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };

    // Union
    const union = (x: string, y: string) => {
      const px = find(x);
      const py = find(y);
      if (px !== py) {
        parent[px] = py;
      }
    };

    // Union all connected nodes
    for (const edge of edges) {
      if (parent[edge.sourceKey] !== undefined && parent[edge.targetKey] !== undefined) {
        union(edge.sourceKey, edge.targetKey);
      }
    }

    // Group by root
    const clusters: Record<string, string[]> = {};
    for (const node of nodes) {
      const root = find(node.key);
      if (!clusters[root]) {
        clusters[root] = [];
      }
      clusters[root].push(node.key);
    }

    return Object.values(clusters).filter(c => c.length > 1);
  }

  /**
   * Find shortest path between two memories
   * @param sourceKey - Starting memory key
   * @param targetKey - Target memory key
   */
  public findPath(sourceKey: string, targetKey: string): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{ key: string; path: string[] }> = [
      { key: sourceKey, path: [sourceKey] }
    ];

    while (queue.length > 0) {
      const { key, path } = queue.shift()!;

      if (key === targetKey) {
        return path;
      }

      if (visited.has(key)) continue;
      visited.add(key);

      const relations = this.getRelations(key, 'both');
      for (const rel of relations) {
        const neighborKey = rel.sourceKey === key ? rel.targetKey : rel.sourceKey;
        if (!visited.has(neighborKey)) {
          queue.push({ key: neighborKey, path: [...path, neighborKey] });
        }
      }
    }

    return null;
  }

  /**
   * Remove a relationship between memories
   */
  public unlinkMemories(sourceKey: string, targetKey: string, relationType?: string): boolean {
    let sql = `DELETE FROM memory_relations WHERE sourceKey = ? AND targetKey = ?`;
    const params: any[] = [sourceKey, targetKey];

    if (relationType) {
      sql += ` AND relationType = ?`;
      params.push(relationType);
    }

    const result = this.db.prepare(sql).run(...params);
    return result.changes > 0;
  }

  /**
   * Get memories sorted by time
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param limit - Maximum number of results
   */
  public getTimeline(startDate?: string, endDate?: string, limit: number = 50): MemoryItem[] {
    let sql = `SELECT * FROM memories WHERE 1=1`;
    const params: any[] = [];

    if (startDate) {
      sql += ` AND timestamp >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND timestamp <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    return this.db.prepare(sql).all(...params) as MemoryItem[];
  }

  /**
   * Advanced search with multiple strategies
   */
  public searchAdvanced(
    query: string,
    strategy: 'keyword' | 'graph_traversal' | 'temporal' | 'priority' | 'context_aware',
    options: {
      limit?: number;
      category?: string;
      includeRelations?: boolean;
      startKey?: string;
      depth?: number;
    } = {}
  ): MemoryItem[] {
    const { limit = 20, category, includeRelations = false, startKey, depth = 2 } = options;

    switch (strategy) {
      case 'keyword':
        return this.searchKeyword(query, limit, category);

      case 'graph_traversal':
        if (!startKey) return this.searchKeyword(query, limit, category);
        return this.getRelatedMemories(startKey, depth);

      case 'temporal':
        return this.searchTemporal(query, limit);

      case 'priority':
        return this.searchByPriority(query, limit);

      case 'context_aware':
        return this.searchContextAware(query, limit, category);

      default:
        return this.search(query);
    }
  }

  private searchKeyword(query: string, limit: number, category?: string): MemoryItem[] {
    let sql = `
      SELECT * FROM memories
      WHERE (key LIKE ? OR value LIKE ?)
    `;
    const params: any[] = [`%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY priority DESC, timestamp DESC LIMIT ?`;
    params.push(limit);

    return this.db.prepare(sql).all(...params) as MemoryItem[];
  }

  private searchTemporal(query: string, limit: number): MemoryItem[] {
    const sql = `
      SELECT * FROM memories
      WHERE key LIKE ? OR value LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    return this.db.prepare(sql).all(`%${query}%`, `%${query}%`, limit) as MemoryItem[];
  }

  private searchByPriority(query: string, limit: number): MemoryItem[] {
    const sql = `
      SELECT * FROM memories
      WHERE key LIKE ? OR value LIKE ?
      ORDER BY priority DESC, lastAccessed DESC
      LIMIT ?
    `;
    return this.db.prepare(sql).all(`%${query}%`, `%${query}%`, limit) as MemoryItem[];
  }

  private searchContextAware(query: string, limit: number, category?: string): MemoryItem[] {
    // Combined strategy: keyword + priority + recency
    let sql = `
      SELECT *,
        (CASE WHEN key LIKE ? THEN 3 ELSE 0 END +
         CASE WHEN value LIKE ? THEN 2 ELSE 0 END +
         priority * 0.5) as relevance_score
      FROM memories
      WHERE key LIKE ? OR value LIKE ?
    `;
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY relevance_score DESC, lastAccessed DESC LIMIT ?`;
    params.push(limit);

    return this.db.prepare(sql).all(...params) as MemoryItem[];
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      MemoryManager.instance = null;
    }
  }

  /**
   * Reset singleton instance (useful for testing and cleanup)
   */
  public static resetInstance(): void {
    if (MemoryManager.instance) {
      MemoryManager.instance.close();
    }
  }
}
