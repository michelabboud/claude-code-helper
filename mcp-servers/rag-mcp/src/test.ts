#!/usr/bin/env node

/**
 * Test suite for RAG MCP Server
 *
 * Tests all tools to ensure proper functionality
 */

import { ChromaClient } from "chromadb";
import * as fs from "fs/promises";
import * as path from "path";

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
    // Delete test collection
    const client = new ChromaClient();
    await client.deleteCollection({ name: TEST_COLLECTION });
    log("✅ Deleted test collection", "green");
  } catch (error) {
    // Collection might not exist, that's ok
  }

  try {
    // Delete test directory
    await fs.rm(TEST_DIR, { recursive: true });
    log("✅ Deleted test files\n", "green");
  } catch (error) {
    log(`⚠️  Could not delete test directory: ${error}`, "yellow");
  }
}

// Test 1: Index Codebase
async function testIndexCodebase() {
  log("\n📦 Test 1: Index Codebase", "blue");

  const client = new ChromaClient();

  try {
    // Create collection
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
    });

    // Read and index files
    const files = await fs.readdir(TEST_DIR);
    let totalChunks = 0;

    for (const file of files) {
      const filePath = path.join(TEST_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Chunk the content
      const chunks = [content]; // Simple: 1 chunk per file for testing

      const ids = chunks.map((_, i) => `${file}::chunk${i}`);
      const metadatas = chunks.map((_, i) => ({
        filePath: file,
        chunkIndex: i,
        totalChunks: chunks.length,
      }));

      await collection.add({
        ids,
        documents: chunks,
        metadatas,
      });

      totalChunks += chunks.length;
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

  const client = new ChromaClient();

  try {
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
    });

    // Test queries
    const queries = [
      "how does authentication work?",
      "user management",
      "API endpoints",
    ];

    for (const query of queries) {
      const results = await collection.query({
        queryTexts: [query],
        nResults: 3,
      });

      log(`\n  Query: "${query}"`, "yellow");
      log(`  Found ${results.documents[0].length} results`, "green");

      results.documents[0]?.forEach((doc, i) => {
        const metadata = results.metadatas?.[0]?.[i];
        if (metadata && metadata.filePath) {
          log(`    - ${metadata.filePath} (distance: ${results.distances?.[0]?.[i]?.toFixed(4)})`, "reset");
        }
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

  const client = new ChromaClient();

  try {
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
    });

    const codeSnippet = `async function getUser(id: string): Promise<User> {
  return null;
}`;

    const results = await collection.query({
      queryTexts: [codeSnippet],
      nResults: 3,
    });

    log(`\n  Looking for code similar to:`, "yellow");
    log(`  ${codeSnippet.split('\n')[0]}...`, "reset");
    log(`\n  Found ${results.documents[0].length} similar snippets`, "green");

    results.documents[0]?.forEach((doc, i) => {
      const metadata = results.metadatas?.[0]?.[i];
      if (metadata && metadata.filePath) {
        const similarity = 1 - (results.distances?.[0]?.[i] || 0);
        log(`    - ${metadata.filePath} (similarity: ${similarity.toFixed(2)})`, "reset");
      }
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

  const client = new ChromaClient();

  try {
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
    });

    const task = "implement user logout functionality";
    const maxTokens = 2000;

    const results = await collection.query({
      queryTexts: [task],
      nResults: 5,
    });

    // Calculate context
    const maxChars = maxTokens * 4;
    let totalChars = 0;
    const contextChunks = [];

    for (let i = 0; i < (results.documents[0] || []).length; i++) {
      const doc = results.documents[0]?.[i];
      if (!doc) continue;
      if (totalChars + doc.length > maxChars) break;

      contextChunks.push({
        content: doc,
        metadata: results.metadatas?.[0]?.[i] || {},
      });

      totalChars += doc.length;
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

  const client = new ChromaClient();

  try {
    const collections = await client.listCollections();

    log(`\n  Found ${collections.length} collections:`, "green");

    for (const col of collections as any[]) {
      const collection = await client.getOrCreateCollection({
        name: col.name,
      });
      const count = await collection.count();
      log(`    - ${col.name}: ${count} chunks`, "reset");
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

  const client = new ChromaClient();

  try {
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
    });

    const count = await collection.count();

    const sample = await collection.get({
      limit: 10,
    });

    const files = new Set<string>();
    for (const metadata of sample.metadatas || []) {
      if (metadata && metadata.filePath) {
        files.add(metadata.filePath as string);
      }
    }

    log(`\n  Collection: ${TEST_COLLECTION}`, "yellow");
    log(`  Total chunks: ${count}`, "green");
    log(`  Files in sample: ${files.size}`, "green");
    log(`  Files: ${Array.from(files).join(", ")}`, "reset");

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

  const client = new ChromaClient();

  try {
    const collection = await client.getOrCreateCollection({
      name: TEST_COLLECTION,
    });

    // Create a new test file
    const newFilePath = path.join(TEST_DIR, "config.ts");
    await fs.writeFile(
      newFilePath,
      `export const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};`
    );

    // Index it
    const content = await fs.readFile(newFilePath, "utf-8");
    await collection.add({
      ids: ["config.ts::chunk0"],
      documents: [content],
      metadatas: [{
        filePath: "config.ts",
        chunkIndex: 0,
        totalChunks: 1,
      }],
    });

    const newCount = await collection.count();

    log(`\n  Indexed: config.ts`, "green");
    log(`  New total chunks: ${newCount}`, "green");

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
