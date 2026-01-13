#!/usr/bin/env node

/**
 * RAG (Retrieval-Augmented Generation) MCP Server
 *
 * Provides semantic codebase search and context retrieval through vector embeddings
 * to eliminate AI hallucinations and ground code generation in actual codebase.
 *
 * @author Michel Abboud (https://github.com/michelabboud)
 * @license MIT
 * @see https://github.com/michelabboud/claude-code-helper
 *
 * Created with assistance from Claude Code (Anthropic)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ChromaClient } from "chromadb";
import * as fs from "fs/promises";
import * as path from "path";
import { config } from "dotenv";
import { createVectorDatabase, type VectorDatabase } from "./vector-db-adapter.js";

// Load environment variables
config();

// Initialize vector database client (defaults to ChromaDB)
const dbType = (process.env.VECTOR_DB_TYPE || "chromadb") as "chromadb" | "redis" | "qdrant";
const dbConfig = {
  host: process.env.VECTOR_DB_HOST || (dbType === "chromadb" ? "localhost" : dbType === "redis" ? "localhost" : "localhost"),
  port: parseInt(process.env.VECTOR_DB_PORT || (dbType === "chromadb" ? "8000" : dbType === "redis" ? "6379" : "6333")),
};

console.error(`🔌 Using vector database: ${dbType.toUpperCase()} at ${dbConfig.host}:${dbConfig.port}`);

// Embedding configuration
const embeddingType = (process.env.EMBEDDING_TYPE || "local") as "local" | "openai";
const modelVariant = (process.env.MODEL_VARIANT || "default").toLowerCase();

if (dbType !== "chromadb") {
  console.error(`🧠 Embedding provider: ${embeddingType.toUpperCase()}`);
  if (embeddingType === "local") {
    console.error(`   Model variant: ${modelVariant}`);
  }
}

// Create database adapter (will be initialized async)
let vectorDB: VectorDatabase;
let dbInitPromise: Promise<void>;

// Initialize database async
dbInitPromise = (async () => {
  try {
    vectorDB = await createVectorDatabase(dbType, dbConfig, embeddingType, modelVariant);
    console.error(`✅ ${dbType.toUpperCase()} database initialized successfully`);
  } catch (error) {
    console.error(`❌ Failed to initialize ${dbType}:`, error);
    process.exit(1);
  }
})();

// Keep chromaClient for backward compatibility (will be removed in v2.0.0)
const chromaClient = new ChromaClient();

// Tool input schemas
const IndexCodebaseSchema = z.object({
  rootPath: z.string().describe("Root directory path to index"),
  collectionName: z.string().default("codebase").describe("Name for the vector collection"),
  filePatterns: z.array(z.string()).optional().describe("File patterns to include (e.g., ['*.ts', '*.js', '*.py'])"),
  excludePatterns: z.array(z.string()).optional().describe("Patterns to exclude (e.g., ['node_modules/**', 'build/**'])"),
  chunkSize: z.number().default(1000).describe("Maximum characters per code chunk"),
});

const IndexFileSchema = z.object({
  filePath: z.string().describe("Path to file to index"),
  collectionName: z.string().default("codebase").describe("Collection to add to"),
  metadata: z.record(z.any()).optional().describe("Additional metadata"),
});

const SemanticSearchSchema = z.object({
  query: z.string().describe("Natural language query (e.g., 'how does authentication work?')"),
  collectionName: z.string().default("codebase").describe("Collection to search"),
  nResults: z.number().default(5).describe("Number of results to return"),
  filter: z.record(z.any()).optional().describe("Metadata filters"),
});

const FindSimilarCodeSchema = z.object({
  codeSnippet: z.string().describe("Code snippet to find similar matches for"),
  collectionName: z.string().default("codebase").describe("Collection to search"),
  nResults: z.number().default(5).describe("Number of similar results"),
  threshold: z.number().optional().describe("Similarity threshold (0-1)"),
});

const GetRelevantContextSchema = z.object({
  task: z.string().describe("Task description (e.g., 'implement user logout')"),
  collectionName: z.string().default("codebase").describe("Collection to query"),
  maxTokens: z.number().default(4000).describe("Maximum tokens of context to return"),
});

const ListCollectionsSchema = z.object({});

const GetCollectionStatsSchema = z.object({
  collectionName: z.string().describe("Collection name"),
});

const DeleteCollectionSchema = z.object({
  collectionName: z.string().describe("Collection to delete"),
});

// Helper functions
async function readFileRecursive(
  dirPath: string,
  filePatterns?: string[],
  excludePatterns?: string[]
): Promise<{ path: string; content: string }[]> {
  const results: { path: string; content: string }[] = [];

  const shouldExclude = (filePath: string): boolean => {
    if (!excludePatterns) return false;
    return excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(filePath);
    });
  };

  const shouldInclude = (filePath: string): boolean => {
    if (!filePatterns || filePatterns.length === 0) return true;
    return filePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\./g, "\\."));
      return regex.test(filePath);
    });
  };

  async function traverse(currentPath: string) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(dirPath, fullPath);

        if (shouldExclude(relativePath)) continue;

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile() && shouldInclude(entry.name)) {
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            results.push({ path: relativePath, content });
          } catch (error) {
            console.error(`Error reading file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${currentPath}:`, error);
    }
  }

  await traverse(dirPath);
  return results;
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const lines = text.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Tool implementations
async function indexCodebase(args: z.infer<typeof IndexCodebaseSchema>) {
  try {
    const { rootPath, collectionName, filePatterns, excludePatterns, chunkSize } = args;

    // Get or create collection
    let collection;
    try {
      collection = await chromaClient.getOrCreateCollection({
        name: collectionName,
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to create collection: ${error}`,
      };
    }

    // Read all files
    const files = await readFileRecursive(rootPath, filePatterns, excludePatterns);

    let totalChunks = 0;
    const fileStats: Record<string, number> = {};

    // Index each file
    for (const file of files) {
      const chunks = chunkText(file.content, chunkSize);
      fileStats[file.path] = chunks.length;
      totalChunks += chunks.length;

      const ids = chunks.map((_, i) => `${file.path}::chunk${i}`);
      const metadatas = chunks.map((_, i) => ({
        filePath: file.path,
        chunkIndex: i,
        totalChunks: chunks.length,
      }));

      await collection.add({
        ids,
        documents: chunks,
        metadatas,
      });
    }

    return {
      success: true,
      collection: collectionName,
      filesIndexed: files.length,
      totalChunks,
      fileStats,
      message: `Successfully indexed ${files.length} files with ${totalChunks} chunks`,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function indexFile(args: z.infer<typeof IndexFileSchema>) {
  try {
    const { filePath, collectionName, metadata } = args;

    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
    });

    const content = await fs.readFile(filePath, "utf-8");
    const chunks = chunkText(content, 1000);

    const ids = chunks.map((_, i) => `${filePath}::chunk${i}`);
    const metadatas = chunks.map((_, i) => ({
      filePath,
      chunkIndex: i,
      totalChunks: chunks.length,
      ...metadata,
    }));

    await collection.add({
      ids,
      documents: chunks,
      metadatas,
    });

    return {
      success: true,
      file: filePath,
      chunks: chunks.length,
      message: `Successfully indexed ${filePath} with ${chunks.length} chunks`,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function semanticSearch(args: z.infer<typeof SemanticSearchSchema>) {
  try {
    const { query, collectionName, nResults, filter } = args;

    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
    });

    const results = await collection.query({
      queryTexts: [query],
      nResults,
      where: filter,
    });

    const formattedResults = (results.documents[0] || [])
      .map((doc, i) => {
        if (!doc) return null;
        return {
          content: doc,
          metadata: results.metadatas?.[0]?.[i] || {},
          distance: results.distances?.[0]?.[i],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return {
      success: true,
      query,
      results: formattedResults,
      count: formattedResults.length,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function findSimilarCode(args: z.infer<typeof FindSimilarCodeSchema>) {
  try {
    const { codeSnippet, collectionName, nResults, threshold } = args;

    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
    });

    const results = await collection.query({
      queryTexts: [codeSnippet],
      nResults,
    });

    let formattedResults = (results.documents[0] || [])
      .map((doc, i) => {
        if (!doc) return null;
        return {
          content: doc,
          metadata: results.metadatas?.[0]?.[i] || {},
          similarity: 1 - (results.distances?.[0]?.[i] || 0),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (threshold) {
      formattedResults = formattedResults.filter((r) => r.similarity >= threshold);
    }

    return {
      success: true,
      results: formattedResults,
      count: formattedResults.length,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function getRelevantContext(args: z.infer<typeof GetRelevantContextSchema>) {
  try {
    const { task, collectionName, maxTokens } = args;

    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
    });

    // Query with more results initially
    const results = await collection.query({
      queryTexts: [task],
      nResults: 20,
    });

    // Accumulate context up to maxTokens (rough estimate: 1 token ≈ 4 chars)
    const maxChars = maxTokens * 4;
    let totalChars = 0;
    const contextChunks: Array<{
      content: string;
      metadata: any;
      file: string;
    }> = [];

    for (let i = 0; i < (results.documents[0] || []).length; i++) {
      const doc = results.documents[0]?.[i];
      const metadata = results.metadatas?.[0]?.[i];

      if (!doc || !metadata) continue;
      if (totalChars + doc.length > maxChars) break;

      contextChunks.push({
        content: doc,
        metadata,
        file: (metadata.filePath as string) || "unknown",
      });

      totalChars += doc.length;
    }

    // Group by file
    const byFile: Record<string, string[]> = {};
    for (const chunk of contextChunks) {
      if (!byFile[chunk.file]) byFile[chunk.file] = [];
      byFile[chunk.file].push(chunk.content);
    }

    return {
      success: true,
      task,
      context: contextChunks,
      byFile,
      totalChars,
      estimatedTokens: Math.ceil(totalChars / 4),
      filesIncluded: Object.keys(byFile),
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function listCollections(args: z.infer<typeof ListCollectionsSchema>) {
  try {
    const collections = await chromaClient.listCollections();

    const collectionInfo = await Promise.all(
      collections.map(async (col: any) => {
        const collection = await chromaClient.getOrCreateCollection({
          name: col.name,
        });
        const count = await collection.count();
        return {
          name: col.name,
          count,
        };
      })
    );

    return {
      success: true,
      collections: collectionInfo,
      total: collectionInfo.length,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function getCollectionStats(args: z.infer<typeof GetCollectionStatsSchema>) {
  try {
    const { collectionName } = args;

    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
    });

    const count = await collection.count();

    // Get sample to analyze
    const sample = await collection.get({
      limit: 100,
    });

    const files = new Set<string>();
    for (const metadata of sample.metadatas || []) {
      if (metadata && metadata.filePath) {
        files.add(metadata.filePath as string);
      }
    }

    return {
      success: true,
      collection: collectionName,
      totalChunks: count,
      filesInSample: files.size,
      sampleSize: (sample.documents || []).length,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

async function deleteCollection(args: z.infer<typeof DeleteCollectionSchema>) {
  try {
    const { collectionName } = args;

    await chromaClient.deleteCollection({
      name: collectionName,
    });

    return {
      success: true,
      message: `Collection '${collectionName}' deleted successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// Create MCP server
const server = new Server(
  {
    name: "rag-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "index_codebase",
      description:
        "Index an entire codebase directory for semantic search. Recursively processes files and creates vector embeddings.",
      inputSchema: {
        type: "object",
        properties: {
          rootPath: {
            type: "string",
            description: "Root directory path to index",
          },
          collectionName: {
            type: "string",
            description: "Name for the vector collection",
            default: "codebase",
          },
          filePatterns: {
            type: "array",
            items: { type: "string" },
            description: "File patterns to include (e.g., ['*.ts', '*.js', '*.py'])",
          },
          excludePatterns: {
            type: "array",
            items: { type: "string" },
            description: "Patterns to exclude (e.g., ['node_modules/**', 'build/**'])",
          },
          chunkSize: {
            type: "number",
            description: "Maximum characters per code chunk",
            default: 1000,
          },
        },
        required: ["rootPath"],
      },
    },
    {
      name: "index_file",
      description: "Index a single file for semantic search",
      inputSchema: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Path to file to index",
          },
          collectionName: {
            type: "string",
            description: "Collection to add to",
            default: "codebase",
          },
          metadata: {
            type: "object",
            description: "Additional metadata",
          },
        },
        required: ["filePath"],
      },
    },
    {
      name: "semantic_search",
      description:
        "Search codebase using natural language query. Returns most relevant code snippets.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language query (e.g., 'how does authentication work?')",
          },
          collectionName: {
            type: "string",
            description: "Collection to search",
            default: "codebase",
          },
          nResults: {
            type: "number",
            description: "Number of results to return",
            default: 5,
          },
          filter: {
            type: "object",
            description: "Metadata filters",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "find_similar_code",
      description: "Find code similar to a given snippet",
      inputSchema: {
        type: "object",
        properties: {
          codeSnippet: {
            type: "string",
            description: "Code snippet to find similar matches for",
          },
          collectionName: {
            type: "string",
            description: "Collection to search",
            default: "codebase",
          },
          nResults: {
            type: "number",
            description: "Number of similar results",
            default: 5,
          },
          threshold: {
            type: "number",
            description: "Similarity threshold (0-1)",
          },
        },
        required: ["codeSnippet"],
      },
    },
    {
      name: "get_relevant_context",
      description:
        "Get relevant code context for a specific task. Returns context within token budget.",
      inputSchema: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "Task description (e.g., 'implement user logout')",
          },
          collectionName: {
            type: "string",
            description: "Collection to query",
            default: "codebase",
          },
          maxTokens: {
            type: "number",
            description: "Maximum tokens of context to return",
            default: 4000,
          },
        },
        required: ["task"],
      },
    },
    {
      name: "list_collections",
      description: "List all available vector collections",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_collection_stats",
      description: "Get statistics for a specific collection",
      inputSchema: {
        type: "object",
        properties: {
          collectionName: {
            type: "string",
            description: "Collection name",
          },
        },
        required: ["collectionName"],
      },
    },
    {
      name: "delete_collection",
      description: "Delete a vector collection",
      inputSchema: {
        type: "object",
        properties: {
          collectionName: {
            type: "string",
            description: "Collection to delete",
          },
        },
        required: ["collectionName"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // Ensure database is initialized
    await dbInitPromise;

    const { name, arguments: args } = request.params;

    switch (name) {
      case "index_codebase": {
        const validated = IndexCodebaseSchema.parse(args);
        const result = await indexCodebase(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "index_file": {
        const validated = IndexFileSchema.parse(args);
        const result = await indexFile(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "semantic_search": {
        const validated = SemanticSearchSchema.parse(args);
        const result = await semanticSearch(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "find_similar_code": {
        const validated = FindSimilarCodeSchema.parse(args);
        const result = await findSimilarCode(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_relevant_context": {
        const validated = GetRelevantContextSchema.parse(args);
        const result = await getRelevantContext(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_collections": {
        const validated = ListCollectionsSchema.parse(args);
        const result = await listCollections(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_collection_stats": {
        const validated = GetCollectionStatsSchema.parse(args);
        const result = await getCollectionStats(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "delete_collection": {
        const validated = DeleteCollectionSchema.parse(args);
        const result = await deleteCollection(validated);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: String(error) }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RAG MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
