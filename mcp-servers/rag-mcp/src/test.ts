#!/usr/bin/env node

/**
 * Test suite for RAG MCP Server
 *
 * Tests all tools to ensure proper functionality.
 * Respects VECTOR_DB_TYPE env var to test against any supported backend.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { config } from "dotenv";
import { createVectorDatabase, type VectorDatabase, type VectorDocument } from "./vector-db-adapter.js";

// Load environment variables
config();

const TEST_COLLECTION = "test_codebase";
const TEST_DIR = "./test_files";

// Color output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Initialize vector database via adapter
let vectorDB: VectorDatabase;

async function initDB(): Promise<void> {
  const dbType = (process.env.VECTOR_DB_TYPE || "chromadb") as "chromadb" | "redis" | "qdrant";
  const dbConfig = {
    host: process.env.VECTOR_DB_HOST || "localhost",
    port: parseInt(process.env.VECTOR_DB_PORT || (dbType === "chromadb" ? "8000" : dbType === "redis" ? "6379" : "6333")),
  };
  const embeddingType = (process.env.EMBEDDING_TYPE || "local") as "local" | "openai";
  const modelVariant = (process.env.MODEL_VARIANT || "default").toLowerCase();

  log(`\n🔌 Using vector database: ${dbType.toUpperCase()} at ${dbConfig.host}:${dbConfig.port}`, "blue");

  vectorDB = await createVectorDatabase(dbType, dbConfig, embeddingType, modelVariant);
  log(`✅ ${dbType.toUpperCase()} database initialized`, "green");
}

async function setup() {
  log("\n🔧 Setting up test environment...", "blue");

  // Create test directory
  await fs.mkdir(TEST_DIR, { recursive: true });

  // Create test files
  await fs.writeFile(
    path.join(TEST_DIR, "auth.ts"),
    `export function authenticate(user: string, password: string): boolean {
  // Check credentials
  if (!user || !password) return false;

  // Validate against database
  const isValid = validateCredentials(user, password);
  return isValid;
}

function validateCredentials(user: string, password: string): boolean {
  // TODO: Implement actual validation
  return true;
}`
  );

  await fs.writeFile(
    path.join(TEST_DIR, "user.ts"),
    `export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  async getUser(id: string): Promise<User | null> {
    // Fetch user from database
    return null;
  }

  async createUser(username: string, email: string): Promise<User> {
    // Create new user
    const user: User = {
      id: generateId(),
      username,
      email,
      createdAt: new Date(),
    };
    return user;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(7);
}`
  );

  await fs.writeFile(
    path.join(TEST_DIR, "api.ts"),
    `import express from 'express';

const app = express();

app.get('/api/users', async (req, res) => {
  // Get all users
  const users = await getUsers();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  // Create user
  const user = await createUser(req.body);
  res.status(201).json(user);
});

async function getUsers() {
  return [];
}

async function createUser(data: any) {
  return data;
}`
  );

  log("✅ Test environment ready\n", "green");
}

async function cleanup() {
  log("\n🧹 Cleaning up...", "blue");

  try {
    await vectorDB.deleteCollection(TEST_COLLECTION);
    log("✅ Deleted test collection", "green");
  } catch (error) {
    // Collection might not exist, that's ok
  }

  try {
    await fs.rm(TEST_DIR, { recursive: true });
    log("✅ Deleted test files\n", "green");
  } catch (error) {
    log(`⚠️  Could not delete test directory: ${error}`, "yellow");
  }
}

// Test 1: Index Codebase
async function testIndexCodebase() {
  log("\n📦 Test 1: Index Codebase", "blue");

  try {
    await vectorDB.createCollection(TEST_COLLECTION);

    const files = await fs.readdir(TEST_DIR);
    let totalChunks = 0;

    for (const file of files) {
      const filePath = path.join(TEST_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");

      const documents: VectorDocument[] = [{
        id: `${file}::chunk0`,
        content,
        metadata: {
          filePath: file,
          chunkIndex: 0,
          totalChunks: 1,
        },
      }];

      await vectorDB.addDocuments(TEST_COLLECTION, documents);
      totalChunks += 1;
    }

    log(`✅ Indexed ${files.length} files with ${totalChunks} chunks`, "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Test 2: Semantic Search
async function testSemanticSearch() {
  log("\n🔍 Test 2: Semantic Search", "blue");

  try {
    const queries = [
      "how does authentication work?",
      "user management",
      "API endpoints",
    ];

    for (const query of queries) {
      const results = await vectorDB.search(TEST_COLLECTION, query, { nResults: 3 });

      log(`\n  Query: "${query}"`, "yellow");
      log(`  Found ${results.length} results`, "green");

      results.forEach((result) => {
        const filePath = result.metadata?.filePath || "unknown";
        const distance = result.distance?.toFixed(4) ?? result.score?.toFixed(4) ?? "N/A";
        log(`    - ${filePath} (distance/score: ${distance})`, "reset");
      });
    }

    log("\n✅ Semantic search working", "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Test 3: Find Similar Code
async function testFindSimilarCode() {
  log("\n🔎 Test 3: Find Similar Code", "blue");

  try {
    const codeSnippet = `async function getUser(id: string): Promise<User> {
  return null;
}`;

    const results = await vectorDB.search(TEST_COLLECTION, codeSnippet, { nResults: 3 });

    log(`\n  Looking for code similar to:`, "yellow");
    log(`  ${codeSnippet.split('\n')[0]}...`, "reset");
    log(`\n  Found ${results.length} similar snippets`, "green");

    results.forEach((result) => {
      const filePath = result.metadata?.filePath || "unknown";
      const similarity = result.score != null ? result.score : 1 - (result.distance || 0);
      log(`    - ${filePath} (similarity: ${similarity.toFixed(2)})`, "reset");
    });

    log("\n✅ Similar code search working", "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Test 4: Get Relevant Context
async function testGetRelevantContext() {
  log("\n📄 Test 4: Get Relevant Context", "blue");

  try {
    const task = "implement user logout functionality";
    const maxTokens = 2000;

    const results = await vectorDB.search(TEST_COLLECTION, task, { nResults: 5 });

    const maxChars = maxTokens * 4;
    let totalChars = 0;
    const contextChunks = [];

    for (const result of results) {
      if (totalChars + result.content.length > maxChars) break;

      contextChunks.push({
        content: result.content,
        metadata: result.metadata,
      });

      totalChars += result.content.length;
    }

    log(`\n  Task: "${task}"`, "yellow");
    log(`  Max tokens: ${maxTokens}`, "reset");
    log(`  Context chunks: ${contextChunks.length}`, "green");
    log(`  Total characters: ${totalChars}`, "green");
    log(`  Estimated tokens: ${Math.ceil(totalChars / 4)}`, "green");

    log("\n✅ Context retrieval working", "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Test 5: List Collections
async function testListCollections() {
  log("\n📋 Test 5: List Collections", "blue");

  try {
    const collections = await vectorDB.listCollections();

    log(`\n  Found ${collections.length} collections:`, "green");

    for (const col of collections) {
      log(`    - ${col.name}: ${col.count} chunks`, "reset");
    }

    log("\n✅ List collections working", "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Test 6: Get Collection Stats
async function testGetCollectionStats() {
  log("\n📊 Test 6: Get Collection Stats", "blue");

  try {
    const stats = await vectorDB.getCollectionStats(TEST_COLLECTION);

    log(`\n  Collection: ${TEST_COLLECTION}`, "yellow");
    log(`  Total chunks: ${stats.totalChunks}`, "green");

    log("\n✅ Collection stats working", "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Test 7: Index Single File
async function testIndexFile() {
  log("\n📝 Test 7: Index Single File", "blue");

  try {
    const newFilePath = path.join(TEST_DIR, "config.ts");
    await fs.writeFile(
      newFilePath,
      `export const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};`
    );

    const content = await fs.readFile(newFilePath, "utf-8");

    const documents: VectorDocument[] = [{
      id: "config.ts::chunk0",
      content,
      metadata: {
        filePath: "config.ts",
        chunkIndex: 0,
        totalChunks: 1,
      },
    }];

    await vectorDB.addDocuments(TEST_COLLECTION, documents);

    const stats = await vectorDB.getCollectionStats(TEST_COLLECTION);

    log(`\n  Indexed: config.ts`, "green");
    log(`  New total chunks: ${stats.totalChunks}`, "green");

    log("\n✅ Single file indexing working", "green");
    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, "red");
    return false;
  }
}

// Run all tests
async function runTests() {
  log("\n" + "=".repeat(60), "blue");
  log("  RAG MCP SERVER TEST SUITE", "blue");
  log("=".repeat(60) + "\n", "blue");

  await initDB();
  await setup();

  const tests = [
    { name: "Index Codebase", fn: testIndexCodebase },
    { name: "Semantic Search", fn: testSemanticSearch },
    { name: "Find Similar Code", fn: testFindSimilarCode },
    { name: "Get Relevant Context", fn: testGetRelevantContext },
    { name: "List Collections", fn: testListCollections },
    { name: "Get Collection Stats", fn: testGetCollectionStats },
    { name: "Index Single File", fn: testIndexFile },
  ];

  const results = [];

  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
  }

  await cleanup();

  // Summary
  log("\n" + "=".repeat(60), "blue");
  log("  TEST SUMMARY", "blue");
  log("=".repeat(60) + "\n", "blue");

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  results.forEach((result) => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const color = result.passed ? "green" : "red";
    log(`  ${status}  ${result.name}`, color);
  });

  log(`\n  Total: ${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? "green" : "yellow");

  if (passedCount === totalCount) {
    log("\n🎉 All tests passed!\n", "green");
    process.exit(0);
  } else {
    log("\n⚠️  Some tests failed\n", "red");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error}\n`, "red");
  process.exit(1);
});
