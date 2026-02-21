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

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { config } from "dotenv";
import { createVectorDatabase, type VectorDatabase, type VectorDocument } from "./vector-db-adapter.js";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse } from "mcp-shared";

const SERVER_NAME = "rag-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🟣";

// Load environment variables
config();

// Initialize vector database client (defaults to ChromaDB)
const dbType = (process.env.VECTOR_DB_TYPE || "chromadb") as "chromadb" | "redis" | "qdrant";
const dbConfig = {
  host: process.env.VECTOR_DB_HOST || (dbType === "chromadb" ? "localhost" : dbType === "redis" ? "localhost" : "localhost"),
  port: parseInt(process.env.VECTOR_DB_PORT || (dbType === "chromadb" ? "8000" : dbType === "redis" ? "6379" : "6333")),
};

// Embedding configuration
const embeddingType = (process.env.EMBEDDING_TYPE || "local") as "local" | "openai";
const modelVariant = (process.env.MODEL_VARIANT || "default").toLowerCase();

// Database adapter (initialized inside runServer setup)
let vectorDB: VectorDatabase;

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
  metadata: z.record(z.unknown()).optional().describe("Additional metadata"),
});

const SemanticSearchSchema = z.object({
  query: z.string().describe("Natural language query (e.g., 'how does authentication work?')"),
  collectionName: z.string().default("codebase").describe("Collection to search"),
  nResults: z.number().default(5).describe("Number of results to return"),
  filter: z.record(z.unknown()).optional().describe("Metadata filters"),
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

// Helper function (pure - no logger dependency)
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

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Semantic codebase search** — vector indexing, similarity search, and context retrieval for AI agents.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`index_codebase\` | Index an entire codebase directory for semantic search |`,
    `| \`index_file\` | Index a single file for semantic search |`,
    `| \`semantic_search\` | Search codebase using natural language query |`,
    `| \`find_similar_code\` | Find code similar to a given snippet |`,
    `| \`get_relevant_context\` | Get relevant code context within a token budget |`,
    `| \`list_collections\` | List all available vector collections |`,
    `| \`get_collection_stats\` | Get statistics for a specific collection |`,
    `| \`delete_collection\` | Delete a vector collection |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                          → Quick greeting + status check`,
    `hello {"verbose": true}                           → Full server info and tool catalog`,
    `index_codebase {"rootPath": "/path/to/project"}  → Index a codebase`,
    `index_file {"filePath": "/path/to/file.ts"}      → Index a single file`,
    `semantic_search {"query": "how does auth work?"} → Search semantically`,
    `find_similar_code {"codeSnippet": "function login..."} → Find similar code`,
    `get_relevant_context {"task": "implement logout"} → Get task context`,
    `list_collections {}                               → List collections`,
    `get_collection_stats {"collectionName": "codebase"} → Collection stats`,
    `delete_collection {"collectionName": "old-index"} → Delete collection`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}

runServer({
  name: "rag-mcp",
  version: "1.0.0",
  healthChecks: [{
    name: `${dbType}-connection`,
    check: () => vectorDB.healthCheck(),
  }],
  healthCheckOptions: { maxRetries: 3, retryDelayMs: 2000, timeoutMs: 10000 },
}, async (instance) => {
  const { server, logger } = instance;

  logger.info("Using vector database", { type: dbType, host: dbConfig.host, port: dbConfig.port });

  if (dbType !== "chromadb") {
    logger.info("Embedding provider configured", { type: embeddingType, variant: modelVariant });
  }

  // Initialize database
  try {
    vectorDB = await createVectorDatabase(dbType, dbConfig, embeddingType, modelVariant);
    logger.info("Database initialized", { type: dbType });
  } catch (error) {
    logger.error("Failed to initialize database", { type: dbType, error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }

  // Helper function (uses logger)
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
              logger.error("Error reading file", { file: fullPath, error: error instanceof Error ? error.message : String(error) });
            }
          }
        }
      } catch (error) {
        logger.error("Error traversing directory", { directory: currentPath, error: error instanceof Error ? error.message : String(error) });
      }
    }

    await traverse(dirPath);
    return results;
  }

  // Tool implementations
  async function indexCodebase(args: z.infer<typeof IndexCodebaseSchema>) {
    try {
      const { rootPath, collectionName, filePatterns, excludePatterns, chunkSize } = args;

      // Create collection via adapter
      await vectorDB.createCollection(collectionName);

      // Read all files
      const files = await readFileRecursive(rootPath, filePatterns, excludePatterns);

      let totalChunks = 0;
      const fileStats: Record<string, number> = {};

      // Index each file
      for (const file of files) {
        const chunks = chunkText(file.content, chunkSize);
        fileStats[file.path] = chunks.length;
        totalChunks += chunks.length;

        const documents: VectorDocument[] = chunks.map((chunk, i) => ({
          id: `${file.path}::chunk${i}`,
          content: chunk,
          metadata: {
            filePath: file.path,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
        }));

        await vectorDB.addDocuments(collectionName, documents);
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

      await vectorDB.createCollection(collectionName);

      const content = await fs.readFile(filePath, "utf-8");
      const chunks = chunkText(content, 1000);

      const documents: VectorDocument[] = chunks.map((chunk, i) => ({
        id: `${filePath}::chunk${i}`,
        content: chunk,
        metadata: {
          filePath,
          chunkIndex: i,
          totalChunks: chunks.length,
          ...metadata,
        },
      }));

      await vectorDB.addDocuments(collectionName, documents);

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

      const results = await vectorDB.search(collectionName, query, { nResults, filter });

      return {
        success: true,
        query,
        results,
        count: results.length,
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

      const searchResults = await vectorDB.search(collectionName, codeSnippet, { nResults });

      let formattedResults = searchResults.map((r) => ({
        content: r.content,
        metadata: r.metadata,
        similarity: r.score != null ? r.score : 1 - (r.distance || 0),
      }));

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

      const searchResults = await vectorDB.search(collectionName, task, { nResults: 20 });

      // Accumulate context up to maxTokens (rough estimate: 1 token ~ 4 chars)
      const maxChars = maxTokens * 4;
      let totalChars = 0;
      const contextChunks: Array<{
        content: string;
        metadata: Record<string, unknown>;
        file: string;
      }> = [];

      for (const result of searchResults) {
        if (totalChars + result.content.length > maxChars) break;

        contextChunks.push({
          content: result.content,
          metadata: result.metadata,
          file: (result.metadata.filePath as string) || "unknown",
        });

        totalChars += result.content.length;
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

  async function listCollections(_args: z.infer<typeof ListCollectionsSchema>) {
    try {
      const collections = await vectorDB.listCollections();

      return {
        success: true,
        collections,
        total: collections.length,
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

      const stats = await vectorDB.getCollectionStats(collectionName);

      return {
        success: true,
        collection: collectionName,
        totalChunks: stats.totalChunks,
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

      await vectorDB.deleteCollection(collectionName);

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
      {
        name: "hello",
        description: "Handshake check — verify this server is online. Returns a greeting. Pass verbose=true for the full tool catalog, usage guide, and server info.",
        inputSchema: {
          type: "object",
          properties: {
            verbose: { type: "boolean", description: "If true, return full server info, all tools with descriptions, and usage guide" },
          },
          required: [],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
    ],
  }));

  registerTrackedToolHandler(instance, async (request) => {
    const { name, arguments: args } = request.params;
    const requestId = generateRequestId();
    const startTime = performance.now();

    logger.info("Tool called", { requestId, tool: name, args });

    try {
      let response;

      switch (name) {
        case "index_codebase": {
          const validated = IndexCodebaseSchema.parse(args);
          const safePath = sanitizePath(validated.rootPath, process.cwd());
          const result = await indexCodebase({ ...validated, rootPath: safePath });
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "index_file": {
          const validated = IndexFileSchema.parse(args);
          const safePath = sanitizePath(validated.filePath, process.cwd());
          const result = await indexFile({ ...validated, filePath: safePath });
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "semantic_search": {
          const validated = SemanticSearchSchema.parse(args);
          const result = await semanticSearch(validated);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "find_similar_code": {
          const validated = FindSimilarCodeSchema.parse(args);
          const result = await findSimilarCode(validated);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "get_relevant_context": {
          const validated = GetRelevantContextSchema.parse(args);
          const result = await getRelevantContext(validated);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "list_collections": {
          const validated = ListCollectionsSchema.parse(args);
          const result = await listCollections(validated);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "get_collection_stats": {
          const validated = GetCollectionStatsSchema.parse(args);
          const result = await getCollectionStats(validated);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "delete_collection": {
          const validated = DeleteCollectionSchema.parse(args);
          const result = await deleteCollection(validated);
          response = { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
          break;
        }

        case "hello": {
          const verbose = (args as { verbose?: boolean })?.verbose ?? false;
          if (!verbose) {
            response = {
              content: [{
                type: "text",
                text: `${SERVER_COLOR_EMOJI} Hello! I'm **${SERVER_NAME}** v${SERVER_VERSION}.\n\nI'm online and ready to help!\n\nCall \`hello\` with \`{"verbose": true}\` for my full tool catalog and usage guide.`,
              }],
            };
          } else {
            response = {
              content: [{
                type: "text",
                text: buildHelloVerbose(),
              }],
            };
          }
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const durationMs = measureDuration(startTime);
      logger.info("Tool completed", { requestId, tool: name, durationMs });
      return response;
    } catch (error: unknown) {
      const durationMs = measureDuration(startTime);
      logger.error("Tool failed", { requestId, tool: name, durationMs, error: error instanceof Error ? error.message : String(error) });
      return errorResponse(error, name);
    }
  });
});
