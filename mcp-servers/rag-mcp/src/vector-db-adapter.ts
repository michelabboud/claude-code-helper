/**
 * Vector Database Adapter Interface
 *
 * This allows RAG MCP to support multiple vector databases
 * without changing the core implementation.
 */

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  distance?: number;
  score?: number;
}

export interface CollectionInfo {
  name: string;
  count: number;
}

/**
 * Abstract Vector Database Interface
 * All vector DBs must implement this interface
 */
export interface VectorDatabase {
  // Collection management
  createCollection(name: string): Promise<void>;
  deleteCollection(name: string): Promise<void>;
  listCollections(): Promise<CollectionInfo[]>;
  getCollectionStats(name: string): Promise<{ totalChunks: number }>;

  // Document operations
  addDocuments(
    collectionName: string,
    documents: VectorDocument[]
  ): Promise<void>;

  // Search operations
  search(
    collectionName: string,
    query: string,
    options: {
      nResults?: number;
      filter?: Record<string, any>;
    }
  ): Promise<SearchResult[]>;

  // Utility
  healthCheck(): Promise<boolean>;
}

/**
 * ChromaDB Implementation
 */
import { ChromaClient } from "chromadb";

export class ChromaDBAdapter implements VectorDatabase {
  private client: ChromaClient;

  constructor(config?: { host?: string; port?: number }) {
    const url = config?.host
      ? `http://${config.host}:${config.port || 8000}`
      : undefined;
    this.client = new ChromaClient(url ? { path: url } : undefined);
  }

  async createCollection(name: string): Promise<void> {
    await this.client.getOrCreateCollection({ name });
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection({ name });
  }

  async listCollections(): Promise<CollectionInfo[]> {
    const collections = await this.client.listCollections();
    return Promise.all(
      collections.map(async (col: any) => ({
        name: col.name,
        count: await col.count(),
      }))
    );
  }

  async getCollectionStats(name: string): Promise<{ totalChunks: number }> {
    const collection = await this.client.getOrCreateCollection({ name });
    const count = await collection.count();
    return { totalChunks: count };
  }

  async addDocuments(
    collectionName: string,
    documents: VectorDocument[]
  ): Promise<void> {
    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    await collection.add({
      ids: documents.map((d) => d.id),
      documents: documents.map((d) => d.content),
      metadatas: documents.map((d) => d.metadata),
    });
  }

  async search(
    collectionName: string,
    query: string,
    options: { nResults?: number; filter?: Record<string, any> }
  ): Promise<SearchResult[]> {
    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    const results = await collection.query({
      queryTexts: [query],
      nResults: options.nResults || 5,
      where: options.filter,
    });

    return (results.documents[0] || [])
      .map((doc, i) => {
        if (!doc) return null;
        return {
          content: doc,
          metadata: results.metadatas?.[0]?.[i] || {},
          distance: results.distances?.[0]?.[i],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.heartbeat();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Qdrant Implementation
 */
import { QdrantClient } from "@qdrant/js-client-rest";

export class QdrantAdapter implements VectorDatabase {
  private client: QdrantClient;

  constructor(config?: { host?: string; port?: number }) {
    this.client = new QdrantClient({
      url: `http://${config?.host || "localhost"}:${config?.port || 6333}`,
    });
  }

  async createCollection(name: string): Promise<void> {
    try {
      await this.client.createCollection(name, {
        vectors: { size: 384, distance: "Cosine" },
      });
    } catch (error: any) {
      if (!error.message?.includes("already exists")) {
        throw error;
      }
    }
  }

  async deleteCollection(name: string): Promise<void> {
    await this.client.deleteCollection(name);
  }

  async listCollections(): Promise<CollectionInfo[]> {
    const response = await this.client.getCollections();
    return response.collections.map((col) => ({
      name: col.name,
      count: 0, // Would need separate call to get count
    }));
  }

  async getCollectionStats(name: string): Promise<{ totalChunks: number }> {
    const info = await this.client.getCollection(name);
    return { totalChunks: info.points_count || 0 };
  }

  async addDocuments(
    collectionName: string,
    documents: VectorDocument[]
  ): Promise<void> {
    const points = documents.map((doc, idx) => ({
      id: idx,
      vector: doc.embedding || [],
      payload: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    await this.client.upsert(collectionName, {
      wait: true,
      points,
    });
  }

  async search(
    collectionName: string,
    query: string,
    options: { nResults?: number; filter?: Record<string, any> }
  ): Promise<SearchResult[]> {
    // Note: Qdrant requires embedding for search, not text query
    // This is simplified - actual implementation needs embedding function
    throw new Error("Qdrant adapter requires embedding function - not yet implemented");
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Redis Implementation (with RediSearch)
 */
import { createClient } from "redis";

export class RedisAdapter implements VectorDatabase {
  private client: any;
  private connected: boolean = false;

  constructor(config?: { host?: string; port?: number }) {
    this.client = createClient({
      socket: {
        host: config?.host || "localhost",
        port: config?.port || 6379,
      },
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async createCollection(name: string): Promise<void> {
    await this.ensureConnected();
    // Create RediSearch index for this collection
    try {
      await this.client.ft.create(
        `idx:${name}`,
        {
          content: {
            type: "TEXT",
          },
          embedding: {
            type: "VECTOR",
            ALGORITHM: "FLAT",
            TYPE: "FLOAT32",
            DIM: 384,
            DISTANCE_METRIC: "COSINE",
          },
        },
        {
          ON: "HASH",
          PREFIX: `${name}:`,
        }
      );
    } catch (error: any) {
      if (!error.message?.includes("Index already exists")) {
        throw error;
      }
    }
  }

  async deleteCollection(name: string): Promise<void> {
    await this.ensureConnected();
    await this.client.ft.dropIndex(`idx:${name}`);
  }

  async listCollections(): Promise<CollectionInfo[]> {
    await this.ensureConnected();
    const indexes = await this.client.ft._list();
    return indexes
      .filter((idx: string) => idx.startsWith("idx:"))
      .map((idx: string) => ({
        name: idx.replace("idx:", ""),
        count: 0, // Would need to query for actual count
      }));
  }

  async getCollectionStats(name: string): Promise<{ totalChunks: number }> {
    await this.ensureConnected();
    const keys = await this.client.keys(`${name}:*`);
    return { totalChunks: keys.length };
  }

  async addDocuments(
    collectionName: string,
    documents: VectorDocument[]
  ): Promise<void> {
    await this.ensureConnected();

    for (const doc of documents) {
      await this.client.hSet(`${collectionName}:${doc.id}`, {
        content: doc.content,
        ...doc.metadata,
        embedding: doc.embedding
          ? Buffer.from(new Float32Array(doc.embedding).buffer)
          : "",
      });
    }
  }

  async search(
    collectionName: string,
    query: string,
    options: { nResults?: number; filter?: Record<string, any> }
  ): Promise<SearchResult[]> {
    await this.ensureConnected();

    // For Redis, we'd need to generate query embedding
    // This is simplified - actual implementation needs embedding function
    const results = await this.client.ft.search(
      `idx:${collectionName}`,
      `@content:${query}`,
      {
        LIMIT: {
          from: 0,
          size: options.nResults || 5,
        },
      }
    );

    return results.documents.map((doc: any) => ({
      content: doc.value.content,
      metadata: doc.value,
      score: doc.score,
    }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnected();
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create the right database adapter
 */
export function createVectorDatabase(
  type: "chromadb" | "redis" | "qdrant" = "chromadb",
  config?: { host?: string; port?: number }
): VectorDatabase {
  switch (type) {
    case "chromadb":
      return new ChromaDBAdapter(config);
    case "redis":
      return new RedisAdapter(config);
    case "qdrant":
      return new QdrantAdapter(config);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}
