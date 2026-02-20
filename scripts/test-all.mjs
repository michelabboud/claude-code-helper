#!/usr/bin/env node

/**
 * test-all.mjs
 *
 * Discovers all packages with a "test" script in their package.json,
 * runs `npm test` in each, and reports a pass/fail summary.
 * Exits with non-zero status if any test suite fails.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { execFile } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

async function findPackagesWithTests(dir) {
  const packages = [];

  async function walk(currentDir) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Skip node_modules, .git, and hidden directories
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;

      const fullPath = join(currentDir, entry.name);
      const pkgPath = join(fullPath, "package.json");

      try {
        const raw = await readFile(pkgPath, "utf-8");
        const pkg = JSON.parse(raw);
        if (pkg.scripts && pkg.scripts.test) {
          packages.push({
            name: pkg.name || entry.name,
            dir: fullPath,
            relDir: relative(ROOT, fullPath),
          });
        }
      } catch {
        // No package.json or invalid JSON; recurse into subdirectories
        await walk(fullPath);
      }
    }
  }

  await walk(dir);
  return packages;
}

function runNpmTest(pkgDir) {
  return new Promise((resolve) => {
    const child = execFile("npm", ["test"], {
      cwd: pkgDir,
      timeout: 120_000,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data;
    });
    child.stderr?.on("data", (data) => {
      stderr += data;
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on("error", (err) => {
      resolve({ code: 1, stdout, stderr: stderr + "\n" + err.message });
    });
  });
}

async function main() {
  console.log("Discovering packages with test scripts...\n");

  const packages = await findPackagesWithTests(ROOT);

  if (packages.length === 0) {
    console.log("No packages with test scripts found.");
    process.exit(0);
  }

  console.log(`Found ${packages.length} package(s) with test scripts:\n`);
  for (const pkg of packages) {
    console.log(`  - ${pkg.name} (${pkg.relDir})`);
  }
  console.log("");

  const results = [];

  for (const pkg of packages) {
    const label = `${pkg.name} (${pkg.relDir})`;
    process.stdout.write(`Running tests: ${label} ... `);

    const { code, stdout, stderr } = await runNpmTest(pkg.dir);
    const passed = code === 0;
    results.push({ ...pkg, passed, stdout, stderr });

    console.log(passed ? "PASS" : "FAIL");

    if (!passed) {
      // Print output for failed tests to help diagnose
      console.log("\n--- stdout ---");
      console.log(stdout.trim() || "(empty)");
      console.log("--- stderr ---");
      console.log(stderr.trim() || "(empty)");
      console.log("---\n");
    }
  }

  // Summary
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log("\n========================================");
  console.log("              TEST SUMMARY              ");
  console.log("========================================");
  console.log(`  Total:  ${results.length}`);
  console.log(`  Passed: ${passed.length}`);
  console.log(`  Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n  Failed packages:");
    for (const f of failed) {
      console.log(`    - ${f.name} (${f.relDir})`);
    }
  }

  console.log("========================================\n");

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
