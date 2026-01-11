/**
 * Database Performance Testing Script
 * Tests Redis and Qdrant vector database performance
 */

import { createVectorDatabase, VectorDocument } from "./src/vector-db-adapter.js";
import { config } from "dotenv";

config();

// Test documents
const testDocuments: VectorDocument[] = [
  {
    id: "doc1",
    content: "async function getUserById(id: string): Promise<User> { return database.users.findOne({ id }); }",
    metadata: { filePath: "test/auth.ts", type: "function" }
  },
  {
    id: "doc2",
    content: "export function validateEmail(email: string): boolean { return /^[^@]+@[^@]+\\.[^@]+$/.test(email); }",
    metadata: { filePath: "test/validation.ts", type: "function" }
  },
  {
    id: "doc3",
    content: "class UserService { constructor(private db: Database) {} async create(user: User) { return this.db.users.insert(user); } }",
    metadata: { filePath: "test/services.ts", type: "class" }
  },
  {
    id: "doc4",
    content: "interface User { id: string; email: string; name: string; createdAt: Date; }",
    metadata: { filePath: "test/types.ts", type: "interface" }
  },
  {
    id: "doc5",
    content: "export const API_BASE_URL = 'https://api.example.com'; export const TIMEOUT = 5000;",
    metadata: { filePath: "test/config.ts", type: "constant" }
  }
];

interface TestResult {
  database: string;
  indexTime: number;
  searchTime: number;
  results: number;
  success: boolean;
  error?: string;
}

async function testDatabase(dbType: "redis" | "qdrant", host: string, port: number): Promise<TestResult> {
  const result: TestResult = {
    database: dbType.toUpperCase(),
    indexTime: 0,
    searchTime: 0,
    results: 0,
    success: false
  };

  try {
    console.log(`\n🧪 Testing ${dbType.toUpperCase()}...`);

    // Create database instance with embedding generation
    console.log(`   ✓ Initializing with local embeddings...`);
    const db = await createVectorDatabase(dbType, { host, port }, "local");

    // Test 1: Health check
    console.log(`   ✓ Health check...`);
    const healthy = await db.healthCheck();
    if (!healthy) {
      throw new Error(`${dbType} health check failed`);
    }
    console.log(`   ✓ ${dbType.toUpperCase()} is healthy`);

    // Test 2: Create collection
    console.log(`   ✓ Creating test collection...`);
    const collectionName = `test_${dbType}_${Date.now()}`;
    await db.createCollection(collectionName);
    console.log(`   ✓ Collection '${collectionName}' created`);

    // Test 3: Index documents
    console.log(`   ✓ Indexing ${testDocuments.length} documents...`);
    const indexStart = Date.now();

    // Note: Redis and Qdrant need embeddings, but ChromaDB auto-generates them
    // For now, this will test the interface - actual embedding generation would be needed
    await db.addDocuments(collectionName, testDocuments);

    result.indexTime = Date.now() - indexStart;
    console.log(`   ✓ Indexed in ${result.indexTime}ms`);

    // Test 4: Search
    console.log(`   ✓ Searching for 'user authentication'...`);
    const searchStart = Date.now();

    const searchResults = await db.search(collectionName, "user authentication", { nResults: 3 });

    result.searchTime = Date.now() - searchStart;
    result.results = searchResults.length;
    console.log(`   ✓ Found ${result.results} results in ${result.searchTime}ms`);

    // Test 5: Get stats
    const stats = await db.getCollectionStats(collectionName);
    console.log(`   ✓ Collection stats: ${stats.totalChunks} total chunks`);

    // Cleanup
    console.log(`   ✓ Cleaning up...`);
    await db.deleteCollection(collectionName);
    console.log(`   ✓ Collection deleted`);

    result.success = true;
    console.log(`✅ ${dbType.toUpperCase()} test completed successfully!`);

  } catch (error: any) {
    result.error = error.message;
    console.error(`❌ ${dbType.toUpperCase()} test failed:`, error.message);
  }

  return result;
}

async function main() {
  console.log("🚀 RAG MCP Database Performance Testing");
  console.log("=" .repeat(50));

  const results: TestResult[] = [];

  // Test Redis
  try {
    const redisResult = await testDatabase("redis", "localhost", 6379);
    results.push(redisResult);
  } catch (error: any) {
    console.error("Redis test setup failed:", error.message);
    results.push({
      database: "REDIS",
      indexTime: 0,
      searchTime: 0,
      results: 0,
      success: false,
      error: error.message
    });
  }

  // Test Qdrant
  try {
    const qdrantResult = await testDatabase("qdrant", "localhost", 6333);
    results.push(qdrantResult);
  } catch (error: any) {
    console.error("Qdrant test setup failed:", error.message);
    results.push({
      database: "QDRANT",
      indexTime: 0,
      searchTime: 0,
      results: 0,
      success: false,
      error: error.message
    });
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));

  console.log("\n| Database | Status | Index Time | Search Time | Results |");
  console.log("|----------|--------|------------|-------------|---------|");

  for (const result of results) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    const indexTime = result.success ? `${result.indexTime}ms` : "N/A";
    const searchTime = result.success ? `${result.searchTime}ms` : "N/A";
    const resultCount = result.success ? result.results : "N/A";

    console.log(`| ${result.database.padEnd(8)} | ${status.padEnd(6)} | ${indexTime.padEnd(10)} | ${searchTime.padEnd(11)} | ${resultCount.toString().padEnd(7)} |`);

    if (!result.success && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log("\n" + "=".repeat(50));

  // Performance comparison
  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    console.log("\n⚡ Performance Comparison:");
    const fastest = successfulTests.reduce((prev, current) =>
      current.searchTime < prev.searchTime ? current : prev
    );
    console.log(`   Fastest search: ${fastest.database} (${fastest.searchTime}ms)`);

    const slowest = successfulTests.reduce((prev, current) =>
      current.searchTime > prev.searchTime ? current : prev
    );
    console.log(`   Slowest search: ${slowest.database} (${slowest.searchTime}ms)`);

    if (successfulTests.length > 1) {
      const speedup = (slowest.searchTime / fastest.searchTime).toFixed(2);
      console.log(`   ${fastest.database} is ${speedup}x faster than ${slowest.database}`);
    }
  }
}

main().catch(console.error);
