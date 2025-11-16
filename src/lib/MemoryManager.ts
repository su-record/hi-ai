// SQLite-based memory management system
// Replaces JSON file storage with proper database

import Database from 'better-sqlite3';
import path from 'path';
import { promises as fs } from 'fs';

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
