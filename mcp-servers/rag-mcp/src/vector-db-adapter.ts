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
  private embedder: EmbeddingGenerator;

  constructor(
    config?: { host?: string; port?: number },
    embedder?: EmbeddingGenerator
  ) {
    this.client = new QdrantClient({
      url: `http://${config?.host || "localhost"}:${config?.port || 6333}`,
    });

    if (!embedder) {
      throw new Error("QdrantAdapter requires an EmbeddingGenerator");
    }
    this.embedder = embedder;
  }

  async createCollection(name: string): Promise<void> {
    try {
      const dimension = this.embedder.getDimension();
      await this.client.createCollection(name, {
        vectors: { size: dimension, distance: "Cosine" },
      });
      console.error(`✅ Qdrant collection created: ${name} (${dimension} dimensions)`);
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
    // Generate embeddings for all documents
    const points = await Promise.all(
      documents.map(async (doc, idx) => {
        // Generate embedding if not provided
        const embedding = doc.embedding || (await this.embedder.generate(doc.content));

        // Create UUID-based ID from doc.id
        const id = this.hashStringToNumber(doc.id);

        return {
          id,
          vector: embedding,
          payload: {
            content: doc.content,
            docId: doc.id,
            ...doc.metadata,
          },
        };
      })
    );

    await this.client.upsert(collectionName, {
      wait: true,
      points,
    });
  }

  // Helper to convert string ID to numeric ID for Qdrant
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async search(
    collectionName: string,
    query: string,
    options: { nResults?: number; filter?: Record<string, any> }
  ): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.embedder.generate(query);

    // Perform vector search
    const results = await this.client.search(collectionName, {
      vector: queryEmbedding,
      limit: options.nResults || 5,
      with_payload: true,
    });

    return results.map((result: any) => ({
      content: result.payload.content || "",
      metadata: result.payload,
      score: result.score,
    }));
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
import { EmbeddingGenerator } from "./embeddings.js";

export class RedisAdapter implements VectorDatabase {
  private client: any;
  private connected: boolean = false;
  private embedder: EmbeddingGenerator;

  constructor(
    config?: { host?: string; port?: number },
    embedder?: EmbeddingGenerator
  ) {
    this.client = createClient({
      socket: {
        host: config?.host || "localhost",
        port: config?.port || 6379,
      },
    });

    if (!embedder) {
      throw new Error("RedisAdapter requires an EmbeddingGenerator");
    }
    this.embedder = embedder;
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
      const dimension = this.embedder.getDimension();
      await this.client.ft.create(
        `idx:${name}`,
        {
          content: {
            type: "TEXT",
          },
          embedding: {
            type: "VECTOR",
            ALGORITHM: "HNSW",
            TYPE: "FLOAT32",
            DIM: dimension,
            DISTANCE_METRIC: "COSINE",
            M: 40,
            EF_CONSTRUCTION: 200,
          },
        },
        {
          ON: "HASH",
          PREFIX: `${name}:`,
        }
      );
      console.error(`✅ Redis index created: idx:${name} (${dimension} dimensions)`);
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
      // Generate embedding if not provided
      const embedding = doc.embedding || (await this.embedder.generate(doc.content));

      // Convert embedding to buffer
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

      // Store document with embedding
      await this.client.hSet(`${collectionName}:${doc.id}`, {
        content: doc.content,
        ...doc.metadata,
        embedding: embeddingBuffer,
      });
    }
  }

  async search(
    collectionName: string,
    query: string,
    options: { nResults?: number; filter?: Record<string, any> }
  ): Promise<SearchResult[]> {
    await this.ensureConnected();

    // Generate query embedding
    const queryEmbedding = await this.embedder.generate(query);
    const queryBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);

    // Perform KNN vector search
    const results = await this.client.ft.search(
      `idx:${collectionName}`,
      `*=>[KNN ${options.nResults || 5} @embedding $vec AS score]`,
      {
        PARAMS: {
          vec: queryBuffer,
        },
        RETURN: ["content", "score"],
        SORTBY: "score",
        DIALECT: 2,
      }
    );

    if (!results.documents || results.documents.length === 0) {
      return [];
    }

    return results.documents.map((doc: any) => ({
      content: doc.value.content || "",
      metadata: doc.value,
      score: parseFloat(doc.value.score) || 0,
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
export async function createVectorDatabase(
  type: "chromadb" | "redis" | "qdrant" = "chromadb",
  config?: { host?: string; port?: number },
  embeddingType: "local" | "openai" = "local"
): Promise<VectorDatabase> {
  // Import embeddings module dynamically
  const { createEmbeddingGenerator } = await import("./embeddings.js");

  switch (type) {
    case "chromadb":
      // ChromaDB doesn't need embedder (auto-generates)
      return new ChromaDBAdapter(config);

    case "redis": {
      // Redis needs embedder
      const embedder = createEmbeddingGenerator(embeddingType);
      await (embedder as any).initialize?.();
      return new RedisAdapter(config, embedder);
    }

    case "qdrant": {
      // Qdrant needs embedder
      const embedder = createEmbeddingGenerator(embeddingType);
      await (embedder as any).initialize?.();
      return new QdrantAdapter(config, embedder);
    }

    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}
