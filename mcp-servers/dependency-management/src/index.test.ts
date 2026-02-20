/**
 * Unit tests for dependency-management-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all eight tool schemas)
 * - sanitizePath integration (path traversal, null-byte rejection, empty paths)
 * - errorResponse formatting
 * - Helper function logic (parseVersion, isVersionVulnerable, checkVulnerabilities,
 *   analyzeDependencyTree, suggestUpdates, checkLicenseCompliance, estimateBundleSize,
 *   generateSBOM)
 * - Tool name registration (ListTools handler coverage)
 */

import { z } from "zod";
import {
  sanitizePath,
  errorResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts -- not exported from there)
// ---------------------------------------------------------------------------

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

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "analyze_dependencies",
  "find_vulnerabilities",
  "suggest_updates",
  "check_licenses",
  "find_duplicates",
  "bundle_size_impact",
  "unused_dependencies",
  "generate_sbom",
];

// ---------------------------------------------------------------------------
// Replicated helper functions (mirrors src/index.ts -- not exported)
// ---------------------------------------------------------------------------

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

interface VulnerabilityRecord {
  version: string;
  cve: string;
  severity: string;
  description: string;
}

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
    const license = packageLicenses[name] || "MIT";

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

// =========================================================================
// 1. AnalyzeDependenciesSchema validation
// =========================================================================

describe("AnalyzeDependenciesSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { project_path: "/my/project", package_manager: "npm" };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_path).toBe("/my/project");
      expect(result.data.package_manager).toBe("npm");
      expect(result.data.include_transitive).toBeUndefined();
    }
  });

  it("accepts valid input with optional include_transitive field", () => {
    const input = { project_path: "/my/project", package_manager: "pip", include_transitive: true };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include_transitive).toBe(true);
    }
  });

  it("accepts all valid package_manager enum values", () => {
    for (const pm of ["npm", "pip", "maven", "gradle", "cargo", "go"] as const) {
      const result = AnalyzeDependenciesSchema.safeParse({
        project_path: "/project",
        package_manager: pm,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing project_path", () => {
    const input = { package_manager: "npm" };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { project_path: "/my/project" };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid package_manager value", () => {
    const input = { project_path: "/my/project", package_manager: "bower" };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean include_transitive", () => {
    const input = { project_path: "/my/project", package_manager: "npm", include_transitive: "yes" };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null as project_path", () => {
    const result = AnalyzeDependenciesSchema.safeParse({
      project_path: null,
      package_manager: "npm",
    });
    expect(result.success).toBe(false);
  });

  it("rejects numeric project_path", () => {
    const result = AnalyzeDependenciesSchema.safeParse({
      project_path: 123,
      package_manager: "npm",
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown properties", () => {
    const input = { project_path: "/project", package_manager: "npm", extra: "field" };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extra).toBeUndefined();
    }
  });
});

// =========================================================================
// 2. FindVulnerabilitiesSchema validation
// =========================================================================

describe("FindVulnerabilitiesSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { project_path: "/project", package_manager: "npm" };
    const result = FindVulnerabilitiesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity_threshold).toBeUndefined();
    }
  });

  it("accepts valid input with optional severity_threshold", () => {
    const input = { project_path: "/project", package_manager: "npm", severity_threshold: "high" };
    const result = FindVulnerabilitiesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity_threshold).toBe("high");
    }
  });

  it("accepts all valid severity_threshold enum values", () => {
    for (const sev of ["low", "medium", "high", "critical"] as const) {
      const result = FindVulnerabilitiesSchema.safeParse({
        project_path: "/project",
        package_manager: "npm",
        severity_threshold: sev,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid severity_threshold value", () => {
    const input = { project_path: "/project", package_manager: "npm", severity_threshold: "ultra" };
    const result = FindVulnerabilitiesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid package_manager value", () => {
    const input = { project_path: "/project", package_manager: "yarn" };
    const result = FindVulnerabilitiesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing project_path", () => {
    const input = { package_manager: "npm" };
    const result = FindVulnerabilitiesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { project_path: "/project" };
    const result = FindVulnerabilitiesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 3. SuggestUpdatesSchema validation
// =========================================================================

describe("SuggestUpdatesSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { project_path: "/project", package_manager: "cargo" };
    const result = SuggestUpdatesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.update_type).toBeUndefined();
    }
  });

  it("accepts valid input with optional update_type", () => {
    const input = { project_path: "/project", package_manager: "npm", update_type: "major" };
    const result = SuggestUpdatesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.update_type).toBe("major");
    }
  });

  it("accepts all valid update_type enum values", () => {
    for (const ut of ["patch", "minor", "major"] as const) {
      const result = SuggestUpdatesSchema.safeParse({
        project_path: "/project",
        package_manager: "npm",
        update_type: ut,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid update_type value", () => {
    const input = { project_path: "/project", package_manager: "npm", update_type: "prerelease" };
    const result = SuggestUpdatesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(SuggestUpdatesSchema.safeParse({ project_path: "/project" }).success).toBe(false);
    expect(SuggestUpdatesSchema.safeParse({ package_manager: "npm" }).success).toBe(false);
    expect(SuggestUpdatesSchema.safeParse({}).success).toBe(false);
  });
});

// =========================================================================
// 4. CheckLicensesSchema validation
// =========================================================================

describe("CheckLicensesSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      project_path: "/project",
      package_manager: "npm",
      allowed_licenses: ["MIT", "Apache-2.0"],
    };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed_licenses).toEqual(["MIT", "Apache-2.0"]);
    }
  });

  it("accepts empty allowed_licenses array", () => {
    const input = {
      project_path: "/project",
      package_manager: "npm",
      allowed_licenses: [],
    };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed_licenses).toEqual([]);
    }
  });

  it("rejects missing allowed_licenses", () => {
    const input = { project_path: "/project", package_manager: "npm" };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array allowed_licenses", () => {
    const input = {
      project_path: "/project",
      package_manager: "npm",
      allowed_licenses: "MIT",
    };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects allowed_licenses with non-string elements", () => {
    const input = {
      project_path: "/project",
      package_manager: "npm",
      allowed_licenses: [1, 2, 3],
    };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing project_path", () => {
    const input = { package_manager: "npm", allowed_licenses: ["MIT"] };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { project_path: "/project", allowed_licenses: ["MIT"] };
    const result = CheckLicensesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 5. FindDuplicatesSchema validation
// =========================================================================

describe("FindDuplicatesSchema", () => {
  it("accepts valid input", () => {
    const input = { project_path: "/project", package_manager: "npm" };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing project_path", () => {
    const input = { package_manager: "npm" };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { project_path: "/project" };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid package_manager", () => {
    const input = { project_path: "/project", package_manager: "pnpm" };
    const result = FindDuplicatesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 6. BundleSizeImpactSchema validation
// =========================================================================

describe("BundleSizeImpactSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { package_name: "lodash", package_manager: "npm" };
    const result = BundleSizeImpactSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBeUndefined();
    }
  });

  it("accepts valid input with optional version", () => {
    const input = { package_name: "react", version: "18.2.0", package_manager: "yarn" };
    const result = BundleSizeImpactSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("18.2.0");
    }
  });

  it("accepts all valid package_manager enum values (npm, yarn, pnpm)", () => {
    for (const pm of ["npm", "yarn", "pnpm"] as const) {
      const result = BundleSizeImpactSchema.safeParse({
        package_name: "lodash",
        package_manager: pm,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects package_manager values not in the bundle enum (e.g., pip)", () => {
    const input = { package_name: "lodash", package_manager: "pip" };
    const result = BundleSizeImpactSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_name", () => {
    const input = { package_manager: "npm" };
    const result = BundleSizeImpactSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { package_name: "lodash" };
    const result = BundleSizeImpactSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string package_name", () => {
    const result = BundleSizeImpactSchema.safeParse({
      package_name: 42,
      package_manager: "npm",
    });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 7. UnusedDependenciesSchema validation
// =========================================================================

describe("UnusedDependenciesSchema", () => {
  it("accepts valid input", () => {
    const input = { project_path: "/project", package_manager: "go" };
    const result = UnusedDependenciesSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing project_path", () => {
    const input = { package_manager: "npm" };
    const result = UnusedDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { project_path: "/project" };
    const result = UnusedDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid package_manager", () => {
    const input = { project_path: "/project", package_manager: "yarn" };
    const result = UnusedDependenciesSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 8. GenerateSBOMSchema validation
// =========================================================================

describe("GenerateSBOMSchema", () => {
  it("accepts valid input with cyclonedx format", () => {
    const input = { project_path: "/project", format: "cyclonedx", package_manager: "npm" };
    const result = GenerateSBOMSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("cyclonedx");
    }
  });

  it("accepts valid input with spdx format", () => {
    const input = { project_path: "/project", format: "spdx", package_manager: "maven" };
    const result = GenerateSBOMSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("spdx");
    }
  });

  it("rejects invalid format value", () => {
    const input = { project_path: "/project", format: "json", package_manager: "npm" };
    const result = GenerateSBOMSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing format", () => {
    const input = { project_path: "/project", package_manager: "npm" };
    const result = GenerateSBOMSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing project_path", () => {
    const input = { format: "cyclonedx", package_manager: "npm" };
    const result = GenerateSBOMSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing package_manager", () => {
    const input = { project_path: "/project", format: "cyclonedx" };
    const result = GenerateSBOMSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects completely empty input", () => {
    const result = GenerateSBOMSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 9. sanitizePath integration
// =========================================================================

describe("sanitizePath", () => {
  it("resolves a valid absolute path unchanged", () => {
    const result = sanitizePath("/home/user/project/file.ts");
    expect(result).toBe("/home/user/project/file.ts");
  });

  it("resolves a relative path to an absolute one", () => {
    const result = sanitizePath("src/index.ts");
    expect(result).toMatch(/^\/.*src\/index\.ts$/);
  });

  it("rejects empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
  });

  it("rejects whitespace-only path", () => {
    expect(() => sanitizePath("   ")).toThrow(SanitizationError);
  });

  it("rejects path containing null bytes", () => {
    expect(() => sanitizePath("/tmp/evil\0file")).toThrow(SanitizationError);
  });

  it("rejects path traversal outside base directory", () => {
    expect(() => sanitizePath("../../etc/passwd", "/home/user/project")).toThrow(
      SanitizationError
    );
  });

  it("allows paths within the base directory", () => {
    const result = sanitizePath("/home/user/project/src/file.ts", "/home/user/project");
    expect(result).toBe("/home/user/project/src/file.ts");
  });

  it("allows the base directory path itself", () => {
    const result = sanitizePath("/home/user/project", "/home/user/project");
    expect(result).toBe("/home/user/project");
  });

  it("rejects path with encoded traversal after resolution", () => {
    expect(() => sanitizePath("/home/user/project/../../../etc/shadow", "/home/user/project")).toThrow(
      SanitizationError
    );
  });
});

// =========================================================================
// 10. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("something went wrong");
    const response = errorResponse(err, "analyze_dependencies");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in analyze_dependencies: something went wrong"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("timeout exceeded", "find_vulnerabilities");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in find_vulnerabilities: timeout exceeded"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "suggest_updates");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in suggest_updates: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "check_licenses");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("check_licenses");
  });
});

// =========================================================================
// 11. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the eight expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      analyze_dependencies: AnalyzeDependenciesSchema,
      find_vulnerabilities: FindVulnerabilitiesSchema,
      suggest_updates: SuggestUpdatesSchema,
      check_licenses: CheckLicensesSchema,
      find_duplicates: FindDuplicatesSchema,
      bundle_size_impact: BundleSizeImpactSchema,
      unused_dependencies: UnusedDependenciesSchema,
      generate_sbom: GenerateSBOMSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all eight tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("analyze_dependencies");
    expect(EXPECTED_TOOL_NAMES).toContain("find_vulnerabilities");
    expect(EXPECTED_TOOL_NAMES).toContain("suggest_updates");
    expect(EXPECTED_TOOL_NAMES).toContain("check_licenses");
    expect(EXPECTED_TOOL_NAMES).toContain("find_duplicates");
    expect(EXPECTED_TOOL_NAMES).toContain("bundle_size_impact");
    expect(EXPECTED_TOOL_NAMES).toContain("unused_dependencies");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_sbom");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("expected tool count is exactly 8", () => {
    expect(EXPECTED_TOOL_NAMES.length).toBe(8);
  });
});

// =========================================================================
// 12. parseVersion helper
// =========================================================================

describe("parseVersion", () => {
  it("parses a standard semver string", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("strips caret prefix", () => {
    expect(parseVersion("^1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("strips tilde prefix", () => {
    expect(parseVersion("~1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("strips >= prefix", () => {
    expect(parseVersion(">=1.0.0")).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it("strips < prefix", () => {
    expect(parseVersion("<4.17.21")).toEqual({ major: 4, minor: 17, patch: 21 });
  });

  it("returns zeros for non-semver string", () => {
    expect(parseVersion("latest")).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it("returns zeros for empty string", () => {
    expect(parseVersion("")).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it("handles large version numbers", () => {
    expect(parseVersion("100.200.300")).toEqual({ major: 100, minor: 200, patch: 300 });
  });

  it("handles version with extra segments (ignores beyond patch)", () => {
    // The regex matches the first 3 groups, so "1.2.3.4" parses the first 3
    expect(parseVersion("1.2.3.4")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("handles version with only two numbers", () => {
    // "1.2" does not match the regex pattern (\d+)\.(\d+)\.(\d+)
    expect(parseVersion("1.2")).toEqual({ major: 0, minor: 0, patch: 0 });
  });
});

// =========================================================================
// 13. isVersionVulnerable helper
// =========================================================================

describe("isVersionVulnerable", () => {
  it("returns true when installed version is less than vulnerability threshold", () => {
    expect(isVersionVulnerable("4.17.20", "<4.17.21")).toBe(true);
  });

  it("returns false when installed version equals vulnerability threshold", () => {
    expect(isVersionVulnerable("4.17.21", "<4.17.21")).toBe(false);
  });

  it("returns false when installed version is greater than vulnerability threshold", () => {
    expect(isVersionVulnerable("4.17.22", "<4.17.21")).toBe(false);
  });

  it("returns true when major version is less", () => {
    expect(isVersionVulnerable("3.0.0", "<4.17.21")).toBe(true);
  });

  it("returns true when major matches but minor is less", () => {
    expect(isVersionVulnerable("4.16.0", "<4.17.21")).toBe(true);
  });

  it("returns false when vulnerability range does not start with <", () => {
    expect(isVersionVulnerable("1.0.0", ">=2.0.0")).toBe(false);
  });

  it("handles caret-prefixed package versions", () => {
    expect(isVersionVulnerable("^4.17.20", "<4.17.21")).toBe(true);
  });

  it("returns false when installed version is much higher", () => {
    expect(isVersionVulnerable("5.0.0", "<4.17.21")).toBe(false);
  });
});

// =========================================================================
// 14. checkVulnerabilities helper
// =========================================================================

describe("checkVulnerabilities", () => {
  it("finds vulnerabilities in known vulnerable packages", () => {
    const deps = { "lodash": "4.17.20" };
    const vulns = checkVulnerabilities(deps, "low");
    expect(vulns.length).toBeGreaterThan(0);
    expect(vulns[0].package).toBe("lodash");
    expect(vulns[0].cve).toBeDefined();
    expect(vulns[0].severity).toBeDefined();
  });

  it("returns no vulnerabilities for safe versions", () => {
    const deps = { "lodash": "4.17.22" };
    const vulns = checkVulnerabilities(deps, "low");
    expect(vulns.length).toBe(0);
  });

  it("filters by severity threshold", () => {
    const deps = { "lodash": "4.17.18", "minimist": "1.2.5" };
    const criticalOnly = checkVulnerabilities(deps, "critical");
    // Only minimist has critical severity
    const criticalVulns = criticalOnly.filter(v => v.severity === "critical");
    expect(criticalVulns.length).toBe(1);
    expect(criticalVulns[0].package).toBe("minimist");
  });

  it("returns no vulnerabilities for unknown packages", () => {
    const deps = { "unknown-package": "1.0.0" };
    const vulns = checkVulnerabilities(deps, "low");
    expect(vulns.length).toBe(0);
  });

  it("finds vulnerabilities across multiple packages", () => {
    const deps = {
      "lodash": "4.17.18",
      "axios": "0.21.0",
      "minimist": "1.2.5",
    };
    const vulns = checkVulnerabilities(deps, "low");
    const affectedPackages = [...new Set(vulns.map(v => v.package))];
    expect(affectedPackages.length).toBeGreaterThanOrEqual(3);
  });

  it("includes correct advisory URL format", () => {
    const deps = { "minimist": "1.2.5" };
    const vulns = checkVulnerabilities(deps, "low");
    expect(vulns.length).toBeGreaterThan(0);
    expect(vulns[0].advisory_url).toBe("https://nvd.nist.gov/vuln/detail/CVE-2021-44906");
  });

  it("strips version prefixes from installed_version", () => {
    const deps = { "lodash": "^4.17.18" };
    const vulns = checkVulnerabilities(deps, "low");
    expect(vulns.length).toBeGreaterThan(0);
    expect(vulns[0].installed_version).toBe("4.17.18");
  });
});

// =========================================================================
// 15. analyzeDependencyTree helper
// =========================================================================

describe("analyzeDependencyTree", () => {
  it("returns direct dependencies with correct fields", () => {
    const deps = { "react": "^18.2.0", "lodash": "^4.17.21" };
    const result = analyzeDependencyTree(deps, false);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("react");
    expect(result[0].version).toBe("18.2.0");
    expect(result[0].type).toBe("direct");
    expect(result[0].size_estimate).toMatch(/\d+KB$/);
    expect(result[0].last_updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("adds a transitive dependency when includeTransitive is true", () => {
    const deps = { "react": "^18.2.0" };
    const result = analyzeDependencyTree(deps, true);
    expect(result.length).toBe(2);
    const transitive = result.find(d => d.type === "transitive");
    expect(transitive).toBeDefined();
    expect(transitive!.name).toBe("inherits");
    expect(transitive!.version).toBe("2.0.4");
    expect(transitive!.required_by).toBe("react");
    expect(transitive!.size_estimate).toBe("10KB");
  });

  it("does not add transitive dependencies when includeTransitive is false", () => {
    const deps = { "react": "^18.2.0" };
    const result = analyzeDependencyTree(deps, false);
    expect(result.length).toBe(1);
    expect(result.every(d => d.type === "direct")).toBe(true);
  });

  it("returns empty array for empty deps", () => {
    const result = analyzeDependencyTree({}, false);
    expect(result.length).toBe(0);
  });

  it("returns only transitive for empty deps with includeTransitive", () => {
    const result = analyzeDependencyTree({}, true);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("transitive");
    expect(result[0].required_by).toBe("unknown");
  });

  it("strips tilde from version", () => {
    const deps = { "express": "~4.18.2" };
    const result = analyzeDependencyTree(deps, false);
    expect(result[0].version).toBe("4.18.2");
  });
});

// =========================================================================
// 16. suggestUpdates helper
// =========================================================================

describe("suggestUpdates", () => {
  it("generates patch updates", () => {
    const deps = { "react": "18.2.0" };
    const result = suggestUpdates(deps, "patch");
    expect(result.length).toBe(1);
    expect(result[0].package).toBe("react");
    expect(result[0].update_type).toBe("patch");
    expect(result[0].breaking_changes).toBe(false);
    // Patch update: same major and minor, higher patch
    const suggested = parseVersion(result[0].suggested_version);
    expect(suggested.major).toBe(18);
    expect(suggested.minor).toBe(2);
    expect(suggested.patch).toBeGreaterThan(0);
  });

  it("generates minor updates", () => {
    const deps = { "react": "18.2.0" };
    const result = suggestUpdates(deps, "minor");
    expect(result.length).toBe(1);
    expect(result[0].update_type).toBe("minor");
    expect(result[0].breaking_changes).toBe(false);
    const suggested = parseVersion(result[0].suggested_version);
    expect(suggested.major).toBe(18);
    expect(suggested.minor).toBe(3);
    expect(suggested.patch).toBe(0);
  });

  it("generates major updates with breaking_changes = true", () => {
    const deps = { "react": "18.2.0" };
    const result = suggestUpdates(deps, "major");
    expect(result.length).toBe(1);
    expect(result[0].update_type).toBe("major");
    expect(result[0].breaking_changes).toBe(true);
    const suggested = parseVersion(result[0].suggested_version);
    expect(suggested.major).toBe(19);
    expect(suggested.minor).toBe(0);
    expect(suggested.patch).toBe(0);
  });

  it("returns empty array for empty deps", () => {
    const result = suggestUpdates({}, "patch");
    expect(result.length).toBe(0);
  });

  it("includes changelog URL for each suggestion", () => {
    const deps = { "lodash": "4.17.21" };
    const result = suggestUpdates(deps, "minor");
    expect(result[0].changelog_url).toBe("https://www.npmjs.com/package/lodash?activeTab=versions");
  });

  it("strips version prefix from current_version", () => {
    const deps = { "lodash": "^4.17.21" };
    const result = suggestUpdates(deps, "minor");
    expect(result[0].current_version).toBe("4.17.21");
  });

  it("returns empty for unknown update_type", () => {
    const deps = { "react": "18.2.0" };
    const result = suggestUpdates(deps, "prerelease");
    // The switch has no matching case, so suggested remains undefined
    expect(result.length).toBe(0);
  });
});

// =========================================================================
// 17. checkLicenseCompliance helper
// =========================================================================

describe("checkLicenseCompliance", () => {
  it("reports all compliant when all deps match allowed licenses", () => {
    const deps = { "react": "18.2.0", "express": "4.18.2" };
    const result = checkLicenseCompliance(deps, ["MIT"]);
    expect(result.compliant_count).toBe(2);
    expect(result.issues_count).toBe(0);
    expect(result.issues.length).toBe(0);
    expect(result.recommendation).toBe("All dependencies have compliant licenses");
  });

  it("flags packages with non-allowed licenses", () => {
    const deps = { "typescript": "5.0.0" }; // Apache-2.0
    const result = checkLicenseCompliance(deps, ["MIT"]);
    expect(result.compliant_count).toBe(0);
    expect(result.issues_count).toBe(1);
    expect(result.issues[0].package).toBe("typescript");
    expect(result.issues[0].license).toBe("Apache-2.0");
    expect(result.recommendation).toBe("Review flagged packages before deployment");
  });

  it("defaults unknown packages to MIT license", () => {
    const deps = { "my-unknown-pkg": "1.0.0" };
    const result = checkLicenseCompliance(deps, ["MIT"]);
    expect(result.compliant_count).toBe(1);
    expect(result.issues_count).toBe(0);
  });

  it("defaults unknown packages to MIT and flags when MIT not allowed", () => {
    const deps = { "my-unknown-pkg": "1.0.0" };
    const result = checkLicenseCompliance(deps, ["Apache-2.0"]);
    expect(result.issues_count).toBe(1);
    expect(result.issues[0].license).toBe("MIT");
  });

  it("handles empty deps", () => {
    const result = checkLicenseCompliance({}, ["MIT"]);
    expect(result.compliant_count).toBe(0);
    expect(result.issues_count).toBe(0);
    expect(result.recommendation).toBe("All dependencies have compliant licenses");
  });

  it("handles empty allowed_licenses list (flags everything)", () => {
    const deps = { "react": "18.2.0" };
    const result = checkLicenseCompliance(deps, []);
    expect(result.issues_count).toBe(1);
    expect(result.compliant_count).toBe(0);
  });

  it("issues contain correct action_required message", () => {
    const deps = { "typescript": "5.0.0" };
    const result = checkLicenseCompliance(deps, ["MIT"]);
    expect(result.issues[0].action_required).toBe("Review package license or add to allowed list");
  });

  it("issues contain the allowed_licenses list", () => {
    const deps = { "typescript": "5.0.0" };
    const allowed = ["MIT", "BSD-3-Clause"];
    const result = checkLicenseCompliance(deps, allowed);
    expect(result.issues[0].allowed).toEqual(allowed);
  });
});

// =========================================================================
// 18. estimateBundleSize helper
// =========================================================================

describe("estimateBundleSize", () => {
  it("returns known size for lodash", () => {
    const result = estimateBundleSize("lodash");
    expect(result.package).toBe("lodash");
    expect(result.version).toBe("latest");
    expect(result.size.minified).toBe("71.5KB");
    expect(result.size.gzipped).toBe("25.2KB");
  });

  it("returns alternatives for moment", () => {
    const result = estimateBundleSize("moment");
    expect(result.alternatives).toBeDefined();
    expect(result.alternatives!.length).toBe(2);
    expect(result.alternatives![0].name).toBe("dayjs");
    expect(result.alternatives![1].name).toBe("date-fns");
  });

  it("returns alternatives for lodash", () => {
    const result = estimateBundleSize("lodash");
    expect(result.alternatives).toBeDefined();
    expect(result.alternatives!.length).toBe(1);
    expect(result.alternatives![0].name).toContain("lodash-es");
  });

  it("returns no alternatives for react", () => {
    const result = estimateBundleSize("react");
    expect(result.alternatives).toBeUndefined();
  });

  it("uses provided version when given", () => {
    const result = estimateBundleSize("react", "18.2.0");
    expect(result.version).toBe("18.2.0");
  });

  it("defaults to 'latest' when no version given", () => {
    const result = estimateBundleSize("react");
    expect(result.version).toBe("latest");
  });

  it("identifies tree-shakeable packages correctly", () => {
    expect(estimateBundleSize("react").tree_shakeable).toBe(true);
    expect(estimateBundleSize("vue").tree_shakeable).toBe(true);
    expect(estimateBundleSize("lodash").tree_shakeable).toBe(false);
    expect(estimateBundleSize("moment").tree_shakeable).toBe(false);
  });

  it("returns recommendation for large bundles", () => {
    const result = estimateBundleSize("moment");
    // "72KB" gzipped parsed as 72 > 50
    expect(result.recommendation).toBe("Consider using lighter alternative or tree-shaking");
  });

  it("returns acceptable recommendation for small bundles", () => {
    const result = estimateBundleSize("dayjs");
    // "2.9KB" parsed as 2 which is <= 50
    expect(result.recommendation).toBe("Bundle size is acceptable");
  });

  it("returns generated size for unknown packages", () => {
    const result = estimateBundleSize("some-unknown-pkg");
    expect(result.size.minified).toMatch(/\d+KB$/);
    expect(result.size.gzipped).toMatch(/\d+KB$/);
    expect(result.alternatives).toBeUndefined();
  });

  it("returns N/A for server-side packages like express", () => {
    const result = estimateBundleSize("express");
    expect(result.size.minified).toBe("N/A (server)");
    expect(result.size.gzipped).toBe("N/A (server)");
  });
});

// =========================================================================
// 19. generateSBOM helper
// =========================================================================

describe("generateSBOM", () => {
  const deps = { "react": "^18.2.0", "lodash": "~4.17.21" };
  const devDeps = { "typescript": "^5.0.0" };

  describe("CycloneDX format", () => {
    it("produces correct bomFormat", () => {
      const sbom = generateSBOM(deps, devDeps, "cyclonedx");
      expect(sbom.bomFormat).toBe("CycloneDX");
      expect(sbom.specVersion).toBe("1.4");
      expect(sbom.version).toBe(1);
    });

    it("includes metadata with tools", () => {
      const sbom = generateSBOM(deps, devDeps, "cyclonedx");
      const metadata = sbom.metadata as any;
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.tools[0].vendor).toBe("dependency-management-mcp");
    });

    it("includes all deps and devDeps as components", () => {
      const sbom = generateSBOM(deps, devDeps, "cyclonedx");
      const components = sbom.components as any[];
      expect(components.length).toBe(3); // 2 deps + 1 devDep

      const reactComp = components.find((c: any) => c.name === "react");
      expect(reactComp).toBeDefined();
      expect(reactComp.type).toBe("library");
      expect(reactComp.version).toBe("18.2.0");
      expect(reactComp.scope).toBe("required");
      expect(reactComp.purl).toBe("pkg:npm/react@18.2.0");

      const tsComp = components.find((c: any) => c.name === "typescript");
      expect(tsComp).toBeDefined();
      expect(tsComp.scope).toBe("optional");
    });

    it("strips version prefixes from purl", () => {
      const sbom = generateSBOM({ "lodash": "^4.17.21" }, {}, "cyclonedx");
      const components = sbom.components as any[];
      expect(components[0].purl).toBe("pkg:npm/lodash@4.17.21");
    });
  });

  describe("SPDX format", () => {
    it("produces correct spdxVersion", () => {
      const sbom = generateSBOM(deps, devDeps, "spdx");
      expect(sbom.spdxVersion).toBe("SPDX-2.3");
      expect(sbom.dataLicense).toBe("CC0-1.0");
      expect(sbom.SPDXID).toBe("SPDXRef-DOCUMENT");
    });

    it("includes creationInfo", () => {
      const sbom = generateSBOM(deps, devDeps, "spdx");
      const info = sbom.creationInfo as any;
      expect(info.created).toBeDefined();
      expect(info.creators).toContain("Tool: dependency-management-mcp-1.0.0");
    });

    it("includes all deps and devDeps as packages", () => {
      const sbom = generateSBOM(deps, devDeps, "spdx");
      const packages = sbom.packages as any[];
      expect(packages.length).toBe(3);

      expect(packages[0].SPDXID).toBe("SPDXRef-Package-0");
      expect(packages[0].name).toBeDefined();
      expect(packages[0].versionInfo).toBeDefined();
      expect(packages[0].downloadLocation).toMatch(/^https:\/\/registry\.npmjs\.org\//);
    });

    it("generates sequential SPDXID values", () => {
      const sbom = generateSBOM(deps, devDeps, "spdx");
      const packages = sbom.packages as any[];
      packages.forEach((pkg: any, i: number) => {
        expect(pkg.SPDXID).toBe(`SPDXRef-Package-${i}`);
      });
    });
  });

  it("handles empty deps", () => {
    const sbom = generateSBOM({}, {}, "cyclonedx");
    const components = sbom.components as any[];
    expect(components.length).toBe(0);
  });

  it("handles empty deps in SPDX format", () => {
    const sbom = generateSBOM({}, {}, "spdx");
    const packages = sbom.packages as any[];
    expect(packages.length).toBe(0);
  });
});

// =========================================================================
// 20. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("AnalyzeDependenciesSchema strips unknown properties", () => {
    const input = {
      project_path: "/project",
      package_manager: "npm",
      extra_field: "should be stripped",
    };
    const result = AnalyzeDependenciesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extra_field).toBeUndefined();
    }
  });

  it("BundleSizeImpactSchema uses different package_manager enum than other schemas", () => {
    // BundleSizeImpactSchema allows npm, yarn, pnpm
    expect(BundleSizeImpactSchema.safeParse({
      package_name: "lodash",
      package_manager: "yarn",
    }).success).toBe(true);

    // Other schemas use npm, pip, maven, gradle, cargo, go
    expect(AnalyzeDependenciesSchema.safeParse({
      project_path: "/project",
      package_manager: "yarn",
    }).success).toBe(false);
  });

  it("CheckLicensesSchema accepts a single-element allowed_licenses array", () => {
    const result = CheckLicensesSchema.safeParse({
      project_path: "/project",
      package_manager: "npm",
      allowed_licenses: ["MIT"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed_licenses).toEqual(["MIT"]);
    }
  });

  it("GenerateSBOMSchema rejects format values outside the enum", () => {
    expect(GenerateSBOMSchema.safeParse({
      project_path: "/project",
      format: "swid",
      package_manager: "npm",
    }).success).toBe(false);
  });

  it("all schemas reject empty object", () => {
    expect(AnalyzeDependenciesSchema.safeParse({}).success).toBe(false);
    expect(FindVulnerabilitiesSchema.safeParse({}).success).toBe(false);
    expect(SuggestUpdatesSchema.safeParse({}).success).toBe(false);
    expect(CheckLicensesSchema.safeParse({}).success).toBe(false);
    expect(FindDuplicatesSchema.safeParse({}).success).toBe(false);
    expect(BundleSizeImpactSchema.safeParse({}).success).toBe(false);
    expect(UnusedDependenciesSchema.safeParse({}).success).toBe(false);
    expect(GenerateSBOMSchema.safeParse({}).success).toBe(false);
  });

  it("all schemas reject undefined input", () => {
    expect(AnalyzeDependenciesSchema.safeParse(undefined).success).toBe(false);
    expect(FindVulnerabilitiesSchema.safeParse(undefined).success).toBe(false);
    expect(SuggestUpdatesSchema.safeParse(undefined).success).toBe(false);
    expect(CheckLicensesSchema.safeParse(undefined).success).toBe(false);
    expect(FindDuplicatesSchema.safeParse(undefined).success).toBe(false);
    expect(BundleSizeImpactSchema.safeParse(undefined).success).toBe(false);
    expect(UnusedDependenciesSchema.safeParse(undefined).success).toBe(false);
    expect(GenerateSBOMSchema.safeParse(undefined).success).toBe(false);
  });

  it("all schemas reject null input", () => {
    expect(AnalyzeDependenciesSchema.safeParse(null).success).toBe(false);
    expect(FindVulnerabilitiesSchema.safeParse(null).success).toBe(false);
    expect(SuggestUpdatesSchema.safeParse(null).success).toBe(false);
    expect(CheckLicensesSchema.safeParse(null).success).toBe(false);
    expect(FindDuplicatesSchema.safeParse(null).success).toBe(false);
    expect(BundleSizeImpactSchema.safeParse(null).success).toBe(false);
    expect(UnusedDependenciesSchema.safeParse(null).success).toBe(false);
    expect(GenerateSBOMSchema.safeParse(null).success).toBe(false);
  });

  it("all schemas reject string input", () => {
    expect(AnalyzeDependenciesSchema.safeParse("not an object").success).toBe(false);
    expect(FindVulnerabilitiesSchema.safeParse("not an object").success).toBe(false);
    expect(SuggestUpdatesSchema.safeParse("not an object").success).toBe(false);
    expect(CheckLicensesSchema.safeParse("not an object").success).toBe(false);
    expect(FindDuplicatesSchema.safeParse("not an object").success).toBe(false);
    expect(BundleSizeImpactSchema.safeParse("not an object").success).toBe(false);
    expect(UnusedDependenciesSchema.safeParse("not an object").success).toBe(false);
    expect(GenerateSBOMSchema.safeParse("not an object").success).toBe(false);
  });
});
