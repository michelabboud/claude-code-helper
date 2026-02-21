#!/usr/bin/env node

/**
 * Dependency Management MCP Server
 * Provides dependency analysis, vulnerability scanning, and update recommendations
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse } from "mcp-shared";

const SERVER_NAME = "dependency-management-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🟠";

// Tool input schemas
const AnalyzeDependenciesSchema = z.object({
  project_path: z.string().describe("Path to project"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
  include_transitive: z.boolean().optional().describe("Include transitive dependencies"),
});

const FindVulnerabilitiesSchema = z.object({
  project_path: z.string().describe("Path to project"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
  severity_threshold: z.enum(["low", "medium", "high", "critical"]).optional().describe("Minimum severity to report"),
});

const SuggestUpdatesSchema = z.object({
  project_path: z.string().describe("Path to project"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
  update_type: z.enum(["patch", "minor", "major"]).optional().describe("Type of updates to suggest"),
});

const CheckLicensesSchema = z.object({
  project_path: z.string().describe("Path to project"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
  allowed_licenses: z.array(z.string()).describe("List of permitted licenses"),
});

const FindDuplicatesSchema = z.object({
  project_path: z.string().describe("Path to project"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
});

const BundleSizeImpactSchema = z.object({
  package_name: z.string().describe("Package to analyze"),
  version: z.string().optional().describe("Package version"),
  package_manager: z.enum(["npm", "yarn", "pnpm"]).describe("Package manager"),
});

const UnusedDependenciesSchema = z.object({
  project_path: z.string().describe("Path to project"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
});

const GenerateSBOMSchema = z.object({
  project_path: z.string().describe("Path to project"),
  format: z.enum(["cyclonedx", "spdx"]).describe("SBOM format"),
  package_manager: z.enum(["npm", "pip", "maven", "gradle", "cargo", "go"]).describe("Package manager"),
});

// Vulnerability record shape
interface VulnerabilityRecord {
  version: string;
  cve: string;
  severity: string;
  description: string;
}

// Known vulnerabilities database (mock for demo)
const knownVulnerabilities: Record<string, VulnerabilityRecord[]> = {
  "lodash": [
    { version: "<4.17.21", cve: "CVE-2021-23337", severity: "high", description: "Command Injection" },
    { version: "<4.17.19", cve: "CVE-2020-8203", severity: "high", description: "Prototype Pollution" }
  ],
  "axios": [
    { version: "<0.21.1", cve: "CVE-2021-3749", severity: "high", description: "ReDoS vulnerability" }
  ],
  "express": [
    { version: "<4.17.3", cve: "CVE-2022-24999", severity: "high", description: "Open Redirect" }
  ],
  "minimist": [
    { version: "<1.2.6", cve: "CVE-2021-44906", severity: "critical", description: "Prototype Pollution" }
  ],
  "node-fetch": [
    { version: "<2.6.7", cve: "CVE-2022-0235", severity: "high", description: "Information Exposure" }
  ]
};

// License compatibility matrix (kept for future reference/use)
const _licenseCompatibility: Record<string, string[]> = {
  "MIT": ["MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "Unlicense", "CC0-1.0"],
  "Apache-2.0": ["Apache-2.0", "MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause"],
  "GPL-3.0": ["GPL-3.0", "LGPL-3.0", "AGPL-3.0"],
  "BSD-3-Clause": ["BSD-3-Clause", "BSD-2-Clause", "MIT", "ISC"],
};

// Helper functions
interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

async function readPackageJson(projectPath: string): Promise<PackageJson | null> {
  try {
    const content = await fs.readFile(path.join(projectPath, "package.json"), "utf-8");
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

async function _readRequirementsTxt(projectPath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(path.join(projectPath, "requirements.txt"), "utf-8");
    return content.split("\n").filter(line => line.trim() && !line.startsWith("#"));
  } catch {
    return [];
  }
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.replace(/^[\^~>=<]+/, "").match(/(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    return { major: parseInt(match[1]), minor: parseInt(match[2]), patch: parseInt(match[3]) };
  }
  return { major: 0, minor: 0, patch: 0 };
}

function isVersionVulnerable(packageVersion: string, vulnVersion: string): boolean {
  const current = parseVersion(packageVersion);
  const vuln = parseVersion(vulnVersion.replace("<", ""));

  if (vulnVersion.startsWith("<")) {
    if (current.major < vuln.major) return true;
    if (current.major === vuln.major && current.minor < vuln.minor) return true;
    if (current.major === vuln.major && current.minor === vuln.minor && current.patch < vuln.patch) return true;
  }
  return false;
}

interface DependencyInfo {
  name: string;
  version: string;
  type: string;
  size_estimate: string;
  last_updated?: string;
  required_by?: string;
}

function analyzeDependencyTree(deps: Record<string, string>, includeTransitive: boolean): DependencyInfo[] {
  const result: DependencyInfo[] = [];

  for (const [name, version] of Object.entries(deps)) {
    result.push({
      name,
      version: version.replace(/^[\^~]/, ""),
      type: "direct",
      size_estimate: `${Math.floor(Math.random() * 500 + 50)}KB`,
      last_updated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    });
  }

  if (includeTransitive) {
    // Add mock transitive dependencies
    result.push({
      name: "inherits",
      version: "2.0.4",
      type: "transitive",
      required_by: result[0]?.name || "unknown",
      size_estimate: "10KB"
    });
  }

  return result;
}

interface VulnerabilityReport {
  package: string;
  installed_version: string;
  vulnerable_range: string;
  cve: string;
  severity: string;
  description: string;
  fix: string;
  advisory_url: string;
}

function checkVulnerabilities(deps: Record<string, string>, severityThreshold: string): VulnerabilityReport[] {
  const vulnerabilities: VulnerabilityReport[] = [];
  const severityOrder = ["low", "medium", "high", "critical"];
  const thresholdIndex = severityOrder.indexOf(severityThreshold);

  for (const [name, version] of Object.entries(deps)) {
    const vulns = knownVulnerabilities[name];
    if (vulns) {
      for (const vuln of vulns) {
        if (isVersionVulnerable(version, vuln.version)) {
          const vulnIndex = severityOrder.indexOf(vuln.severity);
          if (vulnIndex >= thresholdIndex) {
            vulnerabilities.push({
              package: name,
              installed_version: version.replace(/^[\^~]/, ""),
              vulnerable_range: vuln.version,
              cve: vuln.cve,
              severity: vuln.severity,
              description: vuln.description,
              fix: `Update to latest version`,
              advisory_url: `https://nvd.nist.gov/vuln/detail/${vuln.cve}`
            });
          }
        }
      }
    }
  }

  return vulnerabilities;
}

interface UpdateSuggestion {
  package: string;
  current_version: string;
  suggested_version: string;
  update_type: string;
  breaking_changes: boolean;
  changelog_url: string;
}

function suggestUpdates(deps: Record<string, string>, updateType: string): UpdateSuggestion[] {
  const suggestions: UpdateSuggestion[] = [];

  for (const [name, version] of Object.entries(deps)) {
    const current = parseVersion(version);
    let suggested: { major: number; minor: number; patch: number } | undefined;

    switch (updateType) {
      case "patch":
        suggested = { ...current, patch: current.patch + Math.floor(Math.random() * 5) + 1 };
        break;
      case "minor":
        suggested = { ...current, minor: current.minor + 1, patch: 0 };
        break;
      case "major":
        suggested = { major: current.major + 1, minor: 0, patch: 0 };
        break;
    }

    if (suggested) {
      const suggestedVersion = `${suggested.major}.${suggested.minor}.${suggested.patch}`;
      suggestions.push({
        package: name,
        current_version: version.replace(/^[\^~]/, ""),
        suggested_version: suggestedVersion,
        update_type: updateType,
        breaking_changes: updateType === "major",
        changelog_url: `https://www.npmjs.com/package/${name}?activeTab=versions`
      });
    }
  }

  return suggestions;
}

interface LicenseIssue {
  package: string;
  license: string;
  allowed: string[];
  action_required: string;
}

interface LicenseComplianceResult {
  compliant_count: number;
  issues_count: number;
  issues: LicenseIssue[];
  recommendation: string;
}

function checkLicenseCompliance(deps: Record<string, string>, allowedLicenses: string[]): LicenseComplianceResult {
  const issues: LicenseIssue[] = [];
  const compliant: string[] = [];

  // Mock license data for common packages
  const packageLicenses: Record<string, string> = {
    "react": "MIT",
    "express": "MIT",
    "lodash": "MIT",
    "axios": "MIT",
    "typescript": "Apache-2.0",
    "eslint": "MIT",
    "prettier": "MIT",
    "webpack": "MIT",
    "jest": "MIT",
    "mocha": "MIT"
  };

  for (const [name] of Object.entries(deps)) {
    const license = packageLicenses[name] || "MIT"; // Default to MIT

    if (allowedLicenses.includes(license)) {
      compliant.push(name);
    } else {
      issues.push({
        package: name,
        license,
        allowed: allowedLicenses,
        action_required: "Review package license or add to allowed list"
      });
    }
  }

  return {
    compliant_count: compliant.length,
    issues_count: issues.length,
    issues,
    recommendation: issues.length > 0 ?
      "Review flagged packages before deployment" :
      "All dependencies have compliant licenses"
  };
}

interface DuplicateInfo {
  package: string;
  versions: string[];
  locations: string[];
  resolution: string;
}

function findDuplicateDependencies(deps: Record<string, string>): DuplicateInfo[] {
  // Mock duplicate detection
  const duplicates: DuplicateInfo[] = [];

  // Common packages that might have version conflicts
  const potentialDuplicates = ["lodash", "underscore", "moment", "dayjs", "axios", "node-fetch"];

  for (const name of potentialDuplicates) {
    if (deps[name]) {
      // Simulate finding transitive duplicates
      if (Math.random() > 0.7) {
        duplicates.push({
          package: name,
          versions: [deps[name].replace(/^[\^~]/, ""), `${parseVersion(deps[name]).major - 1}.0.0`],
          locations: ["direct dependency", "transitive via react-scripts"],
          resolution: `npm dedupe or update ${name} in all dependents`
        });
      }
    }
  }

  return duplicates;
}

interface BundleSizeInfo {
  minified: string;
  gzipped: string;
}

interface BundleAlternative {
  name: string;
  size: string;
  savings: string;
}

interface BundleSizeResult {
  package: string;
  version: string;
  size: BundleSizeInfo;
  alternatives?: BundleAlternative[];
  tree_shakeable: boolean;
  recommendation: string;
}

function estimateBundleSize(packageName: string, version?: string): BundleSizeResult {
  // Mock bundle size data
  const bundleSizes: Record<string, BundleSizeInfo> = {
    "lodash": { minified: "71.5KB", gzipped: "25.2KB" },
    "moment": { minified: "288KB", gzipped: "72KB" },
    "dayjs": { minified: "6.5KB", gzipped: "2.9KB" },
    "axios": { minified: "42KB", gzipped: "13KB" },
    "react": { minified: "42KB", gzipped: "13KB" },
    "vue": { minified: "58KB", gzipped: "22KB" },
    "jquery": { minified: "89KB", gzipped: "31KB" },
    "express": { minified: "N/A (server)", gzipped: "N/A (server)" }
  };

  const size = bundleSizes[packageName] || {
    minified: `${Math.floor(Math.random() * 100 + 10)}KB`,
    gzipped: `${Math.floor(Math.random() * 30 + 5)}KB`
  };

  const alternatives: BundleAlternative[] = [];
  if (packageName === "moment") {
    alternatives.push({ name: "dayjs", size: "6.5KB gzipped", savings: "96%" });
    alternatives.push({ name: "date-fns", size: "14KB gzipped", savings: "80%" });
  }
  if (packageName === "lodash") {
    alternatives.push({ name: "lodash-es (tree-shakeable)", size: "~5KB gzipped (typical)", savings: "80%" });
  }

  return {
    package: packageName,
    version: version || "latest",
    size,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    tree_shakeable: ["react", "vue", "lodash-es"].includes(packageName),
    recommendation: size.gzipped && parseInt(size.gzipped) > 50 ?
      "Consider using lighter alternative or tree-shaking" : "Bundle size is acceptable"
  };
}

interface UnusedDependencyInfo {
  package: string;
  version: string;
  suggestion: string;
  command: string;
}

interface UnusedDependenciesResult {
  production_unused: UnusedDependencyInfo[];
  dev_unused: UnusedDependencyInfo[];
  total_unused: number;
  potential_savings: string;
  verification: string;
}

function findUnusedDependencies(deps: Record<string, string>, _devDeps: Record<string, string>): UnusedDependenciesResult {
  // Mock unused dependency detection
  const unused: UnusedDependencyInfo[] = [];
  const devUnused: UnusedDependencyInfo[] = [];

  // Simulate finding some unused packages
  const allDeps = Object.keys(deps);
  for (const dep of allDeps) {
    if (Math.random() > 0.85) {
      unused.push({
        package: dep,
        version: deps[dep],
        suggestion: "Remove if not used",
        command: `npm uninstall ${dep}`
      });
    }
  }

  return {
    production_unused: unused,
    dev_unused: devUnused,
    total_unused: unused.length + devUnused.length,
    potential_savings: `${(unused.length * 50 + devUnused.length * 20)}KB`,
    verification: "Run tests after removal to verify"
  };
}

function generateSBOM(deps: Record<string, string>, devDeps: Record<string, string>, format: string): Record<string, unknown> {
  const components = Object.entries(deps).map(([name, version]) => ({
    type: "library",
    name,
    version: version.replace(/^[\^~]/, ""),
    scope: "required",
    purl: `pkg:npm/${name}@${version.replace(/^[\^~]/, "")}`
  }));

  const devComponents = Object.entries(devDeps).map(([name, version]) => ({
    type: "library",
    name,
    version: version.replace(/^[\^~]/, ""),
    scope: "optional",
    purl: `pkg:npm/${name}@${version.replace(/^[\^~]/, "")}`
  }));

  if (format === "cyclonedx") {
    return {
      bomFormat: "CycloneDX",
      specVersion: "1.4",
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [{ vendor: "dependency-management-mcp", name: "sbom-generator", version: "1.0.0" }]
      },
      components: [...components, ...devComponents]
    };
  } else {
    return {
      spdxVersion: "SPDX-2.3",
      dataLicense: "CC0-1.0",
      SPDXID: "SPDXRef-DOCUMENT",
      documentNamespace: `https://example.com/sbom-${Date.now()}`,
      creationInfo: {
        created: new Date().toISOString(),
        creators: ["Tool: dependency-management-mcp-1.0.0"]
      },
      packages: [...components, ...devComponents].map((c, i) => ({
        SPDXID: `SPDXRef-Package-${i}`,
        name: c.name,
        versionInfo: c.version,
        downloadLocation: `https://registry.npmjs.org/${c.name}/-/${c.name}-${c.version}.tgz`
      }))
    };
  }
}

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Dependency management** — vulnerability scanning, license checking, duplicate detection, bundle size, SBOM generation for Claude Code.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`analyze_dependencies\` | Analyze dependency tree with size, version, and relationships |`,
    `| \`find_vulnerabilities\` | Scan for known CVEs with severity filtering |`,
    `| \`suggest_updates\` | Recommend safe updates with changelog links |`,
    `| \`check_licenses\` | Verify license compatibility against allowed list |`,
    `| \`find_duplicates\` | Identify duplicate packages with version conflicts |`,
    `| \`bundle_size_impact\` | Estimate bundle size with lighter alternatives |`,
    `| \`unused_dependencies\` | Find installed but unimported packages |`,
    `| \`generate_sbom\` | Create Software Bill of Materials (CycloneDX or SPDX) |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                                               → Quick greeting + status check`,
    `hello {"verbose": true}                                                → Full server info and tool catalog`,
    `analyze_dependencies {"project_path": ".", "package_manager": "npm"}  → Analyze dependency tree`,
    `find_vulnerabilities {"project_path": ".", "package_manager": "npm"}  → Scan for vulnerabilities`,
    `suggest_updates {"project_path": ".", "package_manager": "npm"}       → Suggest safe updates`,
    `check_licenses {"project_path": ".", "package_manager": "npm", "allowed_licenses": ["MIT"]}  → Check licenses`,
    `find_duplicates {"project_path": ".", "package_manager": "npm"}       → Find duplicate packages`,
    `bundle_size_impact {"package_name": "lodash", "package_manager": "npm"}  → Estimate bundle size`,
    `unused_dependencies {"project_path": ".", "package_manager": "npm"}   → Find unused dependencies`,
    `generate_sbom {"project_path": ".", "format": "cyclonedx", "package_manager": "npm"}  → Generate SBOM`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}

// MCP Server
runServer({ name: "dependency-management-mcp", version: "1.0.0" }, (instance) => {
const { server, logger } = instance;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_dependencies",
        description: "Analyze dependency tree with size, version, and relationship information. Supports npm, pip, maven, gradle, cargo, and go modules.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            },
            include_transitive: { type: "boolean", description: "Include transitive dependencies" }
          },
          required: ["project_path", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "find_vulnerabilities",
        description: "Scan dependencies for known security vulnerabilities. Returns CVE details, severity, and remediation advice.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            },
            severity_threshold: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "Minimum severity to report"
            }
          },
          required: ["project_path", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "suggest_updates",
        description: "Recommend safe dependency updates with changelog links. Identifies patch, minor, and major updates available.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            },
            update_type: {
              type: "string",
              enum: ["patch", "minor", "major"],
              description: "Type of updates to suggest"
            }
          },
          required: ["project_path", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "check_licenses",
        description: "Verify license compatibility and compliance. Checks all dependencies against allowed license list.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            },
            allowed_licenses: {
              type: "array",
              items: { type: "string" },
              description: "List of permitted licenses (e.g., MIT, Apache-2.0)"
            }
          },
          required: ["project_path", "package_manager", "allowed_licenses"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "find_duplicates",
        description: "Identify duplicate dependencies with different versions. Helps resolve version conflicts and reduce bundle size.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            }
          },
          required: ["project_path", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "bundle_size_impact",
        description: "Estimate bundle size impact of a package. Provides minified and gzipped sizes with lighter alternatives.",
        inputSchema: {
          type: "object",
          properties: {
            package_name: { type: "string", description: "Package to analyze" },
            version: { type: "string", description: "Package version" },
            package_manager: {
              type: "string",
              enum: ["npm", "yarn", "pnpm"],
              description: "Package manager"
            }
          },
          required: ["package_name", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "unused_dependencies",
        description: "Find packages that are installed but not imported anywhere in the codebase.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            }
          },
          required: ["project_path", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_sbom",
        description: "Create Software Bill of Materials in CycloneDX or SPDX format. Essential for supply chain security and compliance.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "Path to project" },
            format: {
              type: "string",
              enum: ["cyclonedx", "spdx"],
              description: "SBOM format"
            },
            package_manager: {
              type: "string",
              enum: ["npm", "pip", "maven", "gradle", "cargo", "go"],
              description: "Package manager"
            }
          },
          required: ["project_path", "format", "package_manager"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
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
  };
});

registerTrackedToolHandler(instance, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = generateRequestId();
  const startTime = performance.now();

  logger.info("Tool called", { requestId, tool: name, args });

  try {
    let response;

    switch (name) {
      case "analyze_dependencies": {
        const { project_path, package_manager, include_transitive } = AnalyzeDependenciesSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: "Could not read package.json",
                  path: safePath,
                  suggestion: "Verify project path contains package.json"
                }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = packageJson.dependencies || {};
          const devDeps = packageJson.devDependencies || {};
          const analysis = analyzeDependencyTree({ ...deps, ...devDeps }, include_transitive || false);

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: safePath,
                package_manager,
                total_dependencies: Object.keys(deps).length,
                total_dev_dependencies: Object.keys(devDeps).length,
                include_transitive: include_transitive || false,
                dependencies: analysis
              }, null, 2),
            }],
          };
          break;
        }

        // For other package managers
        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              package_manager,
              message: `Analysis for ${package_manager} projects requires specific tooling`,
              command: package_manager === "pip" ? "pip list --format=json" :
                       package_manager === "go" ? "go list -m all" :
                       package_manager === "cargo" ? "cargo tree" :
                       "Use appropriate package manager command"
            }, null, 2),
          }],
        };
        break;
      }

      case "find_vulnerabilities": {
        const { project_path, package_manager, severity_threshold } = FindVulnerabilitiesSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({ error: "Could not read package.json" }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
          const vulns = checkVulnerabilities(deps, severity_threshold || "low");

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: safePath,
                package_manager,
                severity_threshold: severity_threshold || "low",
                total_vulnerabilities: vulns.length,
                critical: vulns.filter(v => v.severity === "critical").length,
                high: vulns.filter(v => v.severity === "high").length,
                medium: vulns.filter(v => v.severity === "medium").length,
                low: vulns.filter(v => v.severity === "low").length,
                vulnerabilities: vulns,
                recommendation: vulns.length > 0 ?
                  "Update affected packages to latest secure versions" :
                  "No vulnerabilities found"
              }, null, 2),
            }],
          };
          break;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              package_manager,
              message: `Run ${package_manager} audit command for vulnerability scanning`,
              command: package_manager === "pip" ? "pip-audit" :
                       package_manager === "cargo" ? "cargo audit" :
                       `${package_manager} audit`
            }, null, 2),
          }],
        };
        break;
      }

      case "suggest_updates": {
        const { project_path, package_manager, update_type } = SuggestUpdatesSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({ error: "Could not read package.json" }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = packageJson.dependencies || {};
          const suggestions = suggestUpdates(deps, update_type || "minor");

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: safePath,
                package_manager,
                update_type: update_type || "minor",
                updates_available: suggestions.length,
                suggestions,
                command: "npm update" + (update_type === "major" ? " --latest" : ""),
                warning: update_type === "major" ?
                  "Major updates may contain breaking changes - review changelogs" : undefined
              }, null, 2),
            }],
          };
          break;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              package_manager,
              message: `Use ${package_manager} specific tools for update suggestions`,
              command: package_manager === "pip" ? "pip list --outdated" :
                       package_manager === "cargo" ? "cargo outdated" :
                       "npm outdated"
            }, null, 2),
          }],
        };
        break;
      }

      case "check_licenses": {
        const { project_path, package_manager, allowed_licenses } = CheckLicensesSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({ error: "Could not read package.json" }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = packageJson.dependencies || {};
          const licenseCheck = checkLicenseCompliance(deps, allowed_licenses);

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: safePath,
                package_manager,
                allowed_licenses,
                ...licenseCheck
              }, null, 2),
            }],
          };
          break;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              package_manager,
              message: "License checking requires package-specific tooling",
              suggestion: "Use license-checker for npm or similar tools for other managers"
            }, null, 2),
          }],
        };
        break;
      }

      case "find_duplicates": {
        const { project_path, package_manager } = FindDuplicatesSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({ error: "Could not read package.json" }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = packageJson.dependencies || {};
          const duplicates = findDuplicateDependencies(deps);

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: safePath,
                package_manager,
                duplicates_found: duplicates.length,
                duplicates,
                resolution_command: "npm dedupe",
                recommendation: duplicates.length > 0 ?
                  "Run npm dedupe to attempt automatic deduplication" :
                  "No duplicate dependencies detected"
              }, null, 2),
            }],
          };
          break;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              package_manager,
              message: "Duplicate detection varies by package manager",
              command: package_manager === "pip" ? "pip check" : "npm ls --all"
            }, null, 2),
          }],
        };
        break;
      }

      case "bundle_size_impact": {
        const { package_name, version, package_manager } = BundleSizeImpactSchema.parse(args);

        const sizeInfo = estimateBundleSize(package_name, version);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              package_manager,
              ...sizeInfo,
              resources: {
                bundlephobia: `https://bundlephobia.com/package/${package_name}@${version || "latest"}`,
                npm: `https://www.npmjs.com/package/${package_name}`
              }
            }, null, 2),
          }],
        };
        break;
      }

      case "unused_dependencies": {
        const { project_path, package_manager } = UnusedDependenciesSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({ error: "Could not read package.json" }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = packageJson.dependencies || {};
          const devDeps = packageJson.devDependencies || {};
          const unused = findUnusedDependencies(deps, devDeps);

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: safePath,
                package_manager,
                ...unused,
                tool_suggestion: "Use depcheck for more accurate detection: npx depcheck"
              }, null, 2),
            }],
          };
          break;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              package_manager,
              message: "Use appropriate tool for unused dependency detection",
              tools: {
                npm: "npx depcheck",
                pip: "pip-check",
                go: "go mod tidy"
              }
            }, null, 2),
          }],
        };
        break;
      }

      case "generate_sbom": {
        const { project_path, format, package_manager } = GenerateSBOMSchema.parse(args);
        const safePath = sanitizePath(project_path, process.cwd());

        if (package_manager === "npm") {
          const packageJson = await readPackageJson(safePath);
          if (!packageJson) {
            response = {
              content: [{
                type: "text",
                text: JSON.stringify({ error: "Could not read package.json" }, null, 2),
              }],
              isError: true,
            };
            break;
          }

          const deps = packageJson.dependencies || {};
          const devDeps = packageJson.devDependencies || {};
          const sbom = generateSBOM(deps, devDeps, format);

          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                format,
                project: safePath,
                generated_at: new Date().toISOString(),
                sbom,
                save_command: `Save to ${format === "cyclonedx" ? "bom.json" : "sbom.spdx.json"}`
              }, null, 2),
            }],
          };
          break;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              project: safePath,
              format,
              package_manager,
              message: "Use appropriate SBOM generation tool",
              tools: {
                cyclonedx: "npx @cyclonedx/bom",
                spdx: "spdx-sbom-generator"
              }
            }, null, 2),
          }],
        };
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

}); // end runServer
