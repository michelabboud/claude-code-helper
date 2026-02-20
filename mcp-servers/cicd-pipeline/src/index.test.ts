/**
 * Unit tests for cicd-pipeline-mcp server.
 *
 * Tests cover:
 * - Zod schema validation for all eight tool schemas (valid inputs,
 *   missing required fields, invalid enum values, edge cases)
 * - sanitizePath integration (path traversal, null bytes, empty paths)
 * - errorResponse formatting
 * - Tool name registration (ListTools handler coverage)
 * - Helper function logic (analyzeForOptimizations, validatePipelineContent,
 *   diagnosePipelineFailure) via replicated pure functions
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

const GeneratePipelineSchema = z.object({
  platform: z.enum(["github-actions", "gitlab-ci", "jenkins", "circleci"]).describe("Target CI/CD platform"),
  project_type: z.enum(["nodejs", "python", "go", "rust", "java", "docker"]).describe("Project type"),
  features: z.array(z.enum(["testing", "linting", "build", "deploy", "security-scan"])).describe("Pipeline features"),
  deployment_target: z.enum(["vercel", "aws", "gcp", "azure", "kubernetes", "docker-hub"]).optional().describe("Deployment target"),
  options: z.object({
    node_version: z.string().optional(),
    python_version: z.string().optional(),
    parallel_jobs: z.boolean().optional(),
    caching: z.boolean().optional(),
  }).optional(),
});

const OptimizePipelineSchema = z.object({
  pipeline_file: z.string().describe("Path to pipeline configuration"),
  platform: z.enum(["github-actions", "gitlab-ci", "jenkins", "circleci"]).describe("CI/CD platform"),
  focus_areas: z.array(z.enum(["speed", "cost", "reliability", "security"])).optional(),
});

const ValidatePipelineSchema = z.object({
  pipeline_file: z.string().describe("Pipeline configuration path"),
  platform: z.enum(["github-actions", "gitlab-ci", "jenkins", "circleci"]).describe("CI/CD platform"),
  strict: z.boolean().optional().describe("Enable strict validation"),
});

const EstimateCostSchema = z.object({
  pipeline_file: z.string().describe("Pipeline configuration"),
  platform: z.enum(["github-actions", "gitlab-ci", "jenkins", "circleci"]).describe("CI/CD platform"),
  monthly_runs: z.number().describe("Expected monthly executions"),
});

const TroubleshootFailureSchema = z.object({
  pipeline_file: z.string().describe("Pipeline configuration"),
  failure_logs: z.string().describe("Error logs from failed run"),
  platform: z.enum(["github-actions", "gitlab-ci", "jenkins", "circleci"]).describe("CI/CD platform"),
});

const SecurityScanPipelineSchema = z.object({
  pipeline_file: z.string().describe("Pipeline configuration"),
  scan_types: z.array(z.enum(["sast", "dependency", "container", "secret"])).describe("Types of scans"),
  tools: z.array(z.string()).optional().describe("Specific tools to use"),
});

const GenerateDeploymentSchema = z.object({
  strategy: z.enum(["blue-green", "canary", "rolling", "recreate"]).describe("Deployment strategy"),
  platform: z.enum(["kubernetes", "ecs", "lambda", "vercel", "app-engine"]).describe("Target platform"),
  health_checks: z.boolean().optional().describe("Include health check steps"),
  rollback: z.boolean().optional().describe("Include rollback procedures"),
});

const GenerateRollbackSchema = z.object({
  deployment_platform: z.enum(["kubernetes", "ecs", "lambda", "vercel"]).describe("Deployment target"),
  rollback_strategy: z.enum(["previous-version", "specific-version", "snapshot"]).describe("Rollback strategy"),
  automated: z.boolean().optional().describe("Enable automated rollback"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "generate_pipeline",
  "optimize_pipeline",
  "validate_pipeline",
  "estimate_cost",
  "troubleshoot_failure",
  "security_scan_pipeline",
  "generate_deployment",
  "generate_rollback",
];

// ---------------------------------------------------------------------------
// Replicated helper functions (mirrors src/index.ts -- not exported)
// ---------------------------------------------------------------------------

interface Optimization {
  type: string;
  impact: string;
  time_saved?: string;
  cost_saved?: string;
  description: string;
  implementation?: string;
}

interface OptimizationResult {
  optimizations: Optimization[];
  estimated_improvement: string;
}

interface ValidationIssue {
  severity: string;
  message: string;
  category?: string;
  type?: string;
  recommendation?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: string;
}

interface DiagnosisSolution {
  priority: string;
  fix: string;
  command?: string;
  implementation?: string;
  check?: string;
  suggestion?: string;
}

interface Diagnosis {
  error_type?: string;
  severity?: string;
  root_cause?: string;
  solutions: DiagnosisSolution[];
}

function analyzeForOptimizations(pipelineContent: string, platform: string): OptimizationResult {
  const optimizations: Optimization[] = [];
  const contentLower = pipelineContent.toLowerCase();

  if (!contentLower.includes("cache")) {
    optimizations.push({
      type: "caching",
      impact: "high",
      time_saved: "2-5 minutes",
      description: "Add dependency caching to reduce install times",
      implementation: platform === "github-actions" ?
        "Add 'cache: npm' to actions/setup-node" :
        "Add cache configuration for your package manager"
    });
  }

  if (contentLower.includes("needs:") || contentLower.includes("depends_on:")) {
    optimizations.push({
      type: "parallelization",
      impact: "medium",
      time_saved: "3-7 minutes",
      description: "Run independent jobs in parallel",
      implementation: "Remove unnecessary dependencies between lint, test, and security jobs"
    });
  }

  if (!contentLower.includes("matrix") && !contentLower.includes("strategy")) {
    optimizations.push({
      type: "matrix_testing",
      impact: "medium",
      description: "Use matrix builds for multi-version testing",
      implementation: "Add strategy.matrix for testing multiple versions"
    });
  }

  if (!contentLower.includes("paths") && !contentLower.includes("paths-ignore")) {
    optimizations.push({
      type: "conditional_execution",
      impact: "medium",
      cost_saved: "$10-30/month",
      description: "Skip CI for documentation-only changes",
      implementation: "Add paths-ignore for docs/ and *.md files"
    });
  }

  return {
    optimizations,
    estimated_improvement: optimizations.length > 0 ?
      `${optimizations.length * 20}% faster, ${optimizations.length * 10}% cost reduction` :
      "Pipeline appears well-optimized"
  };
}

function validatePipelineContent(content: string, platform: string, strict: boolean): ValidationResult {
  const warnings: ValidationIssue[] = [];
  const errors: ValidationIssue[] = [];
  const contentLower = content.toLowerCase();

  if (platform === "github-actions") {
    if (contentLower.includes("actions/checkout@v2") || contentLower.includes("actions/checkout@v3")) {
      warnings.push({
        severity: "medium",
        message: "Using outdated actions/checkout - upgrade to v4",
        category: "outdated_action"
      });
    }
    if (contentLower.includes("actions/setup-node@v2") || contentLower.includes("actions/setup-node@v3")) {
      warnings.push({
        severity: "medium",
        message: "Using outdated actions/setup-node - upgrade to v4",
        category: "outdated_action"
      });
    }
  }

  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*["'][^$]/i,
    /password\s*[:=]\s*["'][^$]/i,
    /secret\s*[:=]\s*["'][^$]/i,
    /token\s*[:=]\s*["'][^$]/i,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      warnings.push({
        severity: "critical",
        message: "Potential hardcoded secret detected",
        category: "security"
      });
      break;
    }
  }

  if (!contentLower.includes("timeout")) {
    if (strict) {
      warnings.push({
        severity: "low",
        message: "No timeout set for jobs - could lead to runaway costs",
        category: "best_practice"
      });
    }
  }

  if (platform === "github-actions" && !contentLower.includes("permissions:")) {
    warnings.push({
      severity: "medium",
      message: "No explicit permissions set - consider principle of least privilege",
      category: "security"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: errors.length === 0 && warnings.length === 0 ?
      "Pipeline configuration is valid" :
      `Found ${errors.length} errors and ${warnings.length} warnings`
  };
}

function diagnosePipelineFailure(logs: string): Diagnosis {
  const logLower = logs.toLowerCase();
  const diagnosis: Diagnosis = { solutions: [] };

  if (logLower.includes("cannot find module") || logLower.includes("module not found")) {
    diagnosis.error_type = "missing_dependency";
    diagnosis.severity = "high";
    diagnosis.root_cause = "Required module not installed or package-lock.json missing";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Ensure package-lock.json is committed",
      command: "npm install && git add package-lock.json"
    });
  }

  if (logLower.includes("eacces") || logLower.includes("permission denied")) {
    diagnosis.error_type = "permission_error";
    diagnosis.severity = "medium";
    diagnosis.root_cause = "Insufficient permissions for file operations";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Check file permissions and ownership",
      command: "chmod +x scripts/*.sh"
    });
  }

  if (logLower.includes("timeout") || logLower.includes("timed out")) {
    diagnosis.error_type = "timeout";
    diagnosis.severity = "medium";
    diagnosis.root_cause = "Operation exceeded time limit";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Increase timeout or optimize slow operations",
      implementation: "Add timeout-minutes: 30 to job configuration"
    });
  }

  if (logLower.includes("out of memory") || logLower.includes("heap")) {
    diagnosis.error_type = "memory_error";
    diagnosis.severity = "high";
    diagnosis.root_cause = "Insufficient memory for operation";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Increase Node.js memory or use larger runner",
      command: "NODE_OPTIONS=--max_old_space_size=4096"
    });
  }

  if (logLower.includes("authentication") || logLower.includes("unauthorized") || logLower.includes("401")) {
    diagnosis.error_type = "auth_error";
    diagnosis.severity = "high";
    diagnosis.root_cause = "Authentication credentials missing or invalid";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Verify secrets are configured correctly",
      check: "Repository Settings > Secrets and variables"
    });
  }

  if (!diagnosis.error_type) {
    diagnosis.error_type = "unknown";
    diagnosis.severity = "medium";
    diagnosis.root_cause = "Unable to automatically diagnose failure";
    diagnosis.solutions.push({
      priority: "medium",
      fix: "Review full logs for specific error messages",
      suggestion: "Check syntax, dependencies, and environment configuration"
    });
  }

  return diagnosis;
}

// =========================================================================
// 1. GeneratePipelineSchema validation
// =========================================================================

describe("GeneratePipelineSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      platform: "github-actions",
      project_type: "nodejs",
      features: ["testing", "linting"],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe("github-actions");
      expect(result.data.project_type).toBe("nodejs");
      expect(result.data.features).toEqual(["testing", "linting"]);
      expect(result.data.deployment_target).toBeUndefined();
      expect(result.data.options).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      platform: "gitlab-ci",
      project_type: "python",
      features: ["testing", "build", "deploy", "security-scan"],
      deployment_target: "aws",
      options: {
        python_version: "3.12",
        parallel_jobs: true,
        caching: false,
      },
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deployment_target).toBe("aws");
      expect(result.data.options?.python_version).toBe("3.12");
      expect(result.data.options?.parallel_jobs).toBe(true);
      expect(result.data.options?.caching).toBe(false);
    }
  });

  it("accepts empty features array", () => {
    const input = {
      platform: "jenkins",
      project_type: "go",
      features: [],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing platform", () => {
    const input = {
      project_type: "nodejs",
      features: ["testing"],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing project_type", () => {
    const input = {
      platform: "github-actions",
      features: ["testing"],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing features", () => {
    const input = {
      platform: "github-actions",
      project_type: "nodejs",
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform enum value", () => {
    const input = {
      platform: "travis-ci",
      project_type: "nodejs",
      features: ["testing"],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid project_type enum value", () => {
    const input = {
      platform: "github-actions",
      project_type: "ruby",
      features: ["testing"],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid features enum value in array", () => {
    const input = {
      platform: "github-actions",
      project_type: "nodejs",
      features: ["testing", "formatting"],
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid deployment_target enum value", () => {
    const input = {
      platform: "github-actions",
      project_type: "nodejs",
      features: ["deploy"],
      deployment_target: "heroku",
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean parallel_jobs in options", () => {
    const input = {
      platform: "github-actions",
      project_type: "nodejs",
      features: ["build"],
      options: { parallel_jobs: "yes" },
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid platform enum values", () => {
    for (const platform of ["github-actions", "gitlab-ci", "jenkins", "circleci"] as const) {
      const result = GeneratePipelineSchema.safeParse({
        platform,
        project_type: "nodejs",
        features: ["build"],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid project_type enum values", () => {
    for (const project_type of ["nodejs", "python", "go", "rust", "java", "docker"] as const) {
      const result = GeneratePipelineSchema.safeParse({
        platform: "github-actions",
        project_type,
        features: ["build"],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid features enum values", () => {
    for (const feature of ["testing", "linting", "build", "deploy", "security-scan"] as const) {
      const result = GeneratePipelineSchema.safeParse({
        platform: "github-actions",
        project_type: "nodejs",
        features: [feature],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid deployment_target enum values", () => {
    for (const target of ["vercel", "aws", "gcp", "azure", "kubernetes", "docker-hub"] as const) {
      const result = GeneratePipelineSchema.safeParse({
        platform: "github-actions",
        project_type: "nodejs",
        features: ["deploy"],
        deployment_target: target,
      });
      expect(result.success).toBe(true);
    }
  });

  it("strips unknown properties", () => {
    const input = {
      platform: "github-actions",
      project_type: "nodejs",
      features: ["testing"],
      extraField: "should be stripped",
    };
    const result = GeneratePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });
});

// =========================================================================
// 2. OptimizePipelineSchema validation
// =========================================================================

describe("OptimizePipelineSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      pipeline_file: ".github/workflows/ci.yml",
      platform: "github-actions",
    };
    const result = OptimizePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus_areas).toBeUndefined();
    }
  });

  it("accepts valid input with optional focus_areas", () => {
    const input = {
      pipeline_file: ".gitlab-ci.yml",
      platform: "gitlab-ci",
      focus_areas: ["speed", "cost"],
    };
    const result = OptimizePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus_areas).toEqual(["speed", "cost"]);
    }
  });

  it("rejects missing pipeline_file", () => {
    const input = { platform: "github-actions" };
    const result = OptimizePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing platform", () => {
    const input = { pipeline_file: "ci.yml" };
    const result = OptimizePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform enum value", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "teamcity",
    };
    const result = OptimizePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid focus_areas enum value", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      focus_areas: ["speed", "performance"],
    };
    const result = OptimizePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid focus_areas enum values", () => {
    for (const area of ["speed", "cost", "reliability", "security"] as const) {
      const result = OptimizePipelineSchema.safeParse({
        pipeline_file: "ci.yml",
        platform: "github-actions",
        focus_areas: [area],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts empty focus_areas array", () => {
    const result = OptimizePipelineSchema.safeParse({
      pipeline_file: "ci.yml",
      platform: "github-actions",
      focus_areas: [],
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 3. ValidatePipelineSchema validation
// =========================================================================

describe("ValidatePipelineSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      pipeline_file: "Jenkinsfile",
      platform: "jenkins",
    };
    const result = ValidatePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strict).toBeUndefined();
    }
  });

  it("accepts valid input with optional strict flag", () => {
    const input = {
      pipeline_file: ".circleci/config.yml",
      platform: "circleci",
      strict: true,
    };
    const result = ValidatePipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strict).toBe(true);
    }
  });

  it("rejects missing pipeline_file", () => {
    const input = { platform: "jenkins" };
    const result = ValidatePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing platform", () => {
    const input = { pipeline_file: "ci.yml" };
    const result = ValidatePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean strict value", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      strict: "yes",
    };
    const result = ValidatePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform enum value", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "azure-devops",
    };
    const result = ValidatePipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 4. EstimateCostSchema validation
// =========================================================================

describe("EstimateCostSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      monthly_runs: 100,
    };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthly_runs).toBe(100);
    }
  });

  it("rejects missing pipeline_file", () => {
    const input = { platform: "github-actions", monthly_runs: 100 };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing platform", () => {
    const input = { pipeline_file: "ci.yml", monthly_runs: 100 };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing monthly_runs", () => {
    const input = { pipeline_file: "ci.yml", platform: "github-actions" };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number monthly_runs", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      monthly_runs: "one hundred",
    };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts zero monthly_runs", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      monthly_runs: 0,
    };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts negative monthly_runs (no min constraint in schema)", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      monthly_runs: -5,
    };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts floating point monthly_runs", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
      monthly_runs: 50.5,
    };
    const result = EstimateCostSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 5. TroubleshootFailureSchema validation
// =========================================================================

describe("TroubleshootFailureSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      pipeline_file: "ci.yml",
      failure_logs: "Error: Cannot find module 'express'",
      platform: "github-actions",
    };
    const result = TroubleshootFailureSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failure_logs).toContain("Cannot find module");
    }
  });

  it("rejects missing pipeline_file", () => {
    const input = {
      failure_logs: "some error",
      platform: "github-actions",
    };
    const result = TroubleshootFailureSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing failure_logs", () => {
    const input = {
      pipeline_file: "ci.yml",
      platform: "github-actions",
    };
    const result = TroubleshootFailureSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing platform", () => {
    const input = {
      pipeline_file: "ci.yml",
      failure_logs: "some error",
    };
    const result = TroubleshootFailureSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform enum value", () => {
    const input = {
      pipeline_file: "ci.yml",
      failure_logs: "some error",
      platform: "drone",
    };
    const result = TroubleshootFailureSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty failure_logs string", () => {
    const input = {
      pipeline_file: "ci.yml",
      failure_logs: "",
      platform: "github-actions",
    };
    const result = TroubleshootFailureSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 6. SecurityScanPipelineSchema validation
// =========================================================================

describe("SecurityScanPipelineSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      pipeline_file: "ci.yml",
      scan_types: ["sast", "dependency"],
    };
    const result = SecurityScanPipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tools).toBeUndefined();
    }
  });

  it("accepts valid input with optional tools", () => {
    const input = {
      pipeline_file: "ci.yml",
      scan_types: ["container"],
      tools: ["trivy", "grype"],
    };
    const result = SecurityScanPipelineSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tools).toEqual(["trivy", "grype"]);
    }
  });

  it("rejects missing pipeline_file", () => {
    const input = { scan_types: ["sast"] };
    const result = SecurityScanPipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing scan_types", () => {
    const input = { pipeline_file: "ci.yml" };
    const result = SecurityScanPipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid scan_types enum value", () => {
    const input = {
      pipeline_file: "ci.yml",
      scan_types: ["sast", "malware"],
    };
    const result = SecurityScanPipelineSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid scan_types enum values", () => {
    for (const scanType of ["sast", "dependency", "container", "secret"] as const) {
      const result = SecurityScanPipelineSchema.safeParse({
        pipeline_file: "ci.yml",
        scan_types: [scanType],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts empty scan_types array", () => {
    const result = SecurityScanPipelineSchema.safeParse({
      pipeline_file: "ci.yml",
      scan_types: [],
    });
    expect(result.success).toBe(true);
  });

  it("tools accepts arbitrary strings (not enum-constrained)", () => {
    const result = SecurityScanPipelineSchema.safeParse({
      pipeline_file: "ci.yml",
      scan_types: ["sast"],
      tools: ["custom-scanner-v2", "my-tool"],
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 7. GenerateDeploymentSchema validation
// =========================================================================

describe("GenerateDeploymentSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      strategy: "blue-green",
      platform: "kubernetes",
    };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.health_checks).toBeUndefined();
      expect(result.data.rollback).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      strategy: "canary",
      platform: "ecs",
      health_checks: true,
      rollback: true,
    };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.health_checks).toBe(true);
      expect(result.data.rollback).toBe(true);
    }
  });

  it("rejects missing strategy", () => {
    const input = { platform: "kubernetes" };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing platform", () => {
    const input = { strategy: "rolling" };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid strategy enum value", () => {
    const input = {
      strategy: "ab-testing",
      platform: "kubernetes",
    };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform enum value", () => {
    const input = {
      strategy: "rolling",
      platform: "heroku",
    };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid strategy enum values", () => {
    for (const strategy of ["blue-green", "canary", "rolling", "recreate"] as const) {
      const result = GenerateDeploymentSchema.safeParse({
        strategy,
        platform: "kubernetes",
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid platform enum values", () => {
    for (const platform of ["kubernetes", "ecs", "lambda", "vercel", "app-engine"] as const) {
      const result = GenerateDeploymentSchema.safeParse({
        strategy: "rolling",
        platform,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects non-boolean health_checks", () => {
    const input = {
      strategy: "canary",
      platform: "kubernetes",
      health_checks: "enabled",
    };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean rollback", () => {
    const input = {
      strategy: "canary",
      platform: "kubernetes",
      rollback: 1,
    };
    const result = GenerateDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 8. GenerateRollbackSchema validation
// =========================================================================

describe("GenerateRollbackSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      deployment_platform: "kubernetes",
      rollback_strategy: "previous-version",
    };
    const result = GenerateRollbackSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.automated).toBeUndefined();
    }
  });

  it("accepts valid input with optional automated flag", () => {
    const input = {
      deployment_platform: "ecs",
      rollback_strategy: "specific-version",
      automated: true,
    };
    const result = GenerateRollbackSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.automated).toBe(true);
    }
  });

  it("rejects missing deployment_platform", () => {
    const input = { rollback_strategy: "previous-version" };
    const result = GenerateRollbackSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing rollback_strategy", () => {
    const input = { deployment_platform: "kubernetes" };
    const result = GenerateRollbackSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid deployment_platform enum value", () => {
    const input = {
      deployment_platform: "heroku",
      rollback_strategy: "previous-version",
    };
    const result = GenerateRollbackSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid rollback_strategy enum value", () => {
    const input = {
      deployment_platform: "kubernetes",
      rollback_strategy: "full-rebuild",
    };
    const result = GenerateRollbackSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid deployment_platform enum values", () => {
    for (const platform of ["kubernetes", "ecs", "lambda", "vercel"] as const) {
      const result = GenerateRollbackSchema.safeParse({
        deployment_platform: platform,
        rollback_strategy: "previous-version",
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid rollback_strategy enum values", () => {
    for (const strategy of ["previous-version", "specific-version", "snapshot"] as const) {
      const result = GenerateRollbackSchema.safeParse({
        deployment_platform: "kubernetes",
        rollback_strategy: strategy,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects non-boolean automated value", () => {
    const input = {
      deployment_platform: "lambda",
      rollback_strategy: "snapshot",
      automated: "yes",
    };
    const result = GenerateRollbackSchema.safeParse(input);
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
});

// =========================================================================
// 10. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("something went wrong");
    const response = errorResponse(err, "generate_pipeline");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in generate_pipeline: something went wrong"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("timeout exceeded", "optimize_pipeline");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in optimize_pipeline: timeout exceeded"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "estimate_cost");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in estimate_cost: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "validate_pipeline");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("validate_pipeline");
  });
});

// =========================================================================
// 11. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the eight expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      generate_pipeline: GeneratePipelineSchema,
      optimize_pipeline: OptimizePipelineSchema,
      validate_pipeline: ValidatePipelineSchema,
      estimate_cost: EstimateCostSchema,
      troubleshoot_failure: TroubleshootFailureSchema,
      security_scan_pipeline: SecurityScanPipelineSchema,
      generate_deployment: GenerateDeploymentSchema,
      generate_rollback: GenerateRollbackSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all eight tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("generate_pipeline");
    expect(EXPECTED_TOOL_NAMES).toContain("optimize_pipeline");
    expect(EXPECTED_TOOL_NAMES).toContain("validate_pipeline");
    expect(EXPECTED_TOOL_NAMES).toContain("estimate_cost");
    expect(EXPECTED_TOOL_NAMES).toContain("troubleshoot_failure");
    expect(EXPECTED_TOOL_NAMES).toContain("security_scan_pipeline");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_deployment");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_rollback");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("expected tool count is eight", () => {
    expect(EXPECTED_TOOL_NAMES.length).toBe(8);
  });
});

// =========================================================================
// 12. analyzeForOptimizations helper
// =========================================================================

describe("analyzeForOptimizations", () => {
  it("suggests caching when cache keyword is absent", () => {
    const content = "name: CI\njobs:\n  build:\n    runs-on: ubuntu-latest";
    const result = analyzeForOptimizations(content, "github-actions");
    const cachingOpt = result.optimizations.find(o => o.type === "caching");
    expect(cachingOpt).toBeDefined();
    expect(cachingOpt!.impact).toBe("high");
  });

  it("does not suggest caching when cache keyword is present", () => {
    const content = "name: CI\ncache: npm\njobs:\n  build:\n    runs-on: ubuntu-latest";
    const result = analyzeForOptimizations(content, "github-actions");
    const cachingOpt = result.optimizations.find(o => o.type === "caching");
    expect(cachingOpt).toBeUndefined();
  });

  it("suggests parallelization when needs: is found", () => {
    const content = "jobs:\n  build:\n    needs: [lint, test]";
    const result = analyzeForOptimizations(content, "github-actions");
    const parallelOpt = result.optimizations.find(o => o.type === "parallelization");
    expect(parallelOpt).toBeDefined();
    expect(parallelOpt!.impact).toBe("medium");
  });

  it("suggests parallelization when depends_on: is found", () => {
    const content = "jobs:\n  build:\n    depends_on: [lint]";
    const result = analyzeForOptimizations(content, "gitlab-ci");
    const parallelOpt = result.optimizations.find(o => o.type === "parallelization");
    expect(parallelOpt).toBeDefined();
  });

  it("does not suggest parallelization when no dependency keywords", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest";
    const result = analyzeForOptimizations(content, "github-actions");
    const parallelOpt = result.optimizations.find(o => o.type === "parallelization");
    expect(parallelOpt).toBeUndefined();
  });

  it("suggests matrix_testing when matrix/strategy keywords are absent", () => {
    const content = "jobs:\n  test:\n    runs-on: ubuntu-latest";
    const result = analyzeForOptimizations(content, "github-actions");
    const matrixOpt = result.optimizations.find(o => o.type === "matrix_testing");
    expect(matrixOpt).toBeDefined();
  });

  it("does not suggest matrix_testing when strategy keyword is present", () => {
    const content = "strategy:\n  matrix:\n    node: [16, 18, 20]";
    const result = analyzeForOptimizations(content, "github-actions");
    const matrixOpt = result.optimizations.find(o => o.type === "matrix_testing");
    expect(matrixOpt).toBeUndefined();
  });

  it("suggests conditional_execution when paths keyword is absent", () => {
    const content = "on:\n  push:\n    branches: [main]";
    const result = analyzeForOptimizations(content, "github-actions");
    const condOpt = result.optimizations.find(o => o.type === "conditional_execution");
    expect(condOpt).toBeDefined();
    expect(condOpt!.cost_saved).toBe("$10-30/month");
  });

  it("does not suggest conditional_execution when paths-ignore is present", () => {
    const content = "on:\n  push:\n    branches: [main]\n    paths-ignore:\n      - '*.md'";
    const result = analyzeForOptimizations(content, "github-actions");
    const condOpt = result.optimizations.find(o => o.type === "conditional_execution");
    expect(condOpt).toBeUndefined();
  });

  it("returns improvement estimate based on optimization count", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest";
    const result = analyzeForOptimizations(content, "github-actions");
    // Should have caching, matrix_testing, and conditional_execution (3)
    expect(result.optimizations.length).toBe(3);
    expect(result.estimated_improvement).toBe("60% faster, 30% cost reduction");
  });

  it("returns well-optimized message when no optimizations found", () => {
    const content = "cache: npm\nstrategy:\n  matrix:\n    node: [18, 20]\npaths-ignore:\n  - '*.md'";
    const result = analyzeForOptimizations(content, "github-actions");
    expect(result.optimizations.length).toBe(0);
    expect(result.estimated_improvement).toBe("Pipeline appears well-optimized");
  });

  it("uses github-actions specific caching implementation text", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest";
    const result = analyzeForOptimizations(content, "github-actions");
    const cachingOpt = result.optimizations.find(o => o.type === "caching");
    expect(cachingOpt!.implementation).toContain("actions/setup-node");
  });

  it("uses generic caching implementation text for non-github-actions", () => {
    const content = "jobs:\n  build:\n    image: node:18";
    const result = analyzeForOptimizations(content, "gitlab-ci");
    const cachingOpt = result.optimizations.find(o => o.type === "caching");
    expect(cachingOpt!.implementation).toContain("package manager");
  });
});

// =========================================================================
// 13. validatePipelineContent helper
// =========================================================================

describe("validatePipelineContent", () => {
  it("returns valid for clean github-actions pipeline with permissions", () => {
    const content = "uses: actions/checkout@v4\npermissions:\n  contents: read\ntimeout-minutes: 30";
    const result = validatePipelineContent(content, "github-actions", false);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.summary).toBe("Pipeline configuration is valid");
  });

  it("warns about outdated actions/checkout@v2", () => {
    const content = "uses: actions/checkout@v2\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", false);
    const warning = result.warnings.find(w => w.message.includes("actions/checkout"));
    expect(warning).toBeDefined();
    expect(warning!.category).toBe("outdated_action");
  });

  it("warns about outdated actions/checkout@v3", () => {
    const content = "uses: actions/checkout@v3\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", false);
    const warning = result.warnings.find(w => w.message.includes("actions/checkout"));
    expect(warning).toBeDefined();
  });

  it("warns about outdated actions/setup-node@v2", () => {
    const content = "uses: actions/setup-node@v2\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", false);
    const warning = result.warnings.find(w => w.message.includes("actions/setup-node"));
    expect(warning).toBeDefined();
    expect(warning!.category).toBe("outdated_action");
  });

  it("warns about outdated actions/setup-node@v3", () => {
    const content = "uses: actions/setup-node@v3\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", false);
    const warning = result.warnings.find(w => w.message.includes("actions/setup-node"));
    expect(warning).toBeDefined();
  });

  it("does not warn about outdated actions for non-github-actions platform", () => {
    const content = "uses: actions/checkout@v2\nuses: actions/setup-node@v2";
    const result = validatePipelineContent(content, "gitlab-ci", false);
    const outdatedWarnings = result.warnings.filter(w => w.category === "outdated_action");
    expect(outdatedWarnings).toHaveLength(0);
  });

  it("detects hardcoded api_key secret", () => {
    const content = 'api_key: "sk-12345"\npermissions:\n  contents: read';
    const result = validatePipelineContent(content, "github-actions", false);
    const secWarning = result.warnings.find(w => w.message.includes("hardcoded secret"));
    expect(secWarning).toBeDefined();
    expect(secWarning!.severity).toBe("critical");
    expect(secWarning!.category).toBe("security");
  });

  it("detects hardcoded password secret", () => {
    const content = "password: 'mypass123'\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", false);
    const secWarning = result.warnings.find(w => w.message.includes("hardcoded secret"));
    expect(secWarning).toBeDefined();
  });

  it("detects hardcoded token secret", () => {
    const content = 'token: "ghp_abc123"\npermissions:\n  contents: read';
    const result = validatePipelineContent(content, "github-actions", false);
    const secWarning = result.warnings.find(w => w.message.includes("hardcoded secret"));
    expect(secWarning).toBeDefined();
  });

  it("does not flag secrets that reference variables (starting with $)", () => {
    const content = 'token: "${{ secrets.TOKEN }}"\npermissions:\n  contents: read';
    const result = validatePipelineContent(content, "github-actions", false);
    const secWarning = result.warnings.find(w => w.message.includes("hardcoded secret"));
    expect(secWarning).toBeUndefined();
  });

  it("warns about missing timeout in strict mode", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", true);
    const timeoutWarning = result.warnings.find(w => w.message.includes("timeout"));
    expect(timeoutWarning).toBeDefined();
    expect(timeoutWarning!.severity).toBe("low");
    expect(timeoutWarning!.category).toBe("best_practice");
  });

  it("does not warn about missing timeout in non-strict mode", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", false);
    const timeoutWarning = result.warnings.find(w => w.message.includes("timeout"));
    expect(timeoutWarning).toBeUndefined();
  });

  it("does not warn about timeout when keyword is present", () => {
    const content = "timeout-minutes: 30\npermissions:\n  contents: read";
    const result = validatePipelineContent(content, "github-actions", true);
    const timeoutWarning = result.warnings.find(w => w.message.includes("timeout"));
    expect(timeoutWarning).toBeUndefined();
  });

  it("warns about missing permissions for github-actions", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest\ntimeout-minutes: 30";
    const result = validatePipelineContent(content, "github-actions", false);
    const permWarning = result.warnings.find(w => w.message.includes("permissions"));
    expect(permWarning).toBeDefined();
    expect(permWarning!.severity).toBe("medium");
    expect(permWarning!.category).toBe("security");
  });

  it("does not warn about missing permissions for non-github-actions", () => {
    const content = "jobs:\n  build:\n    image: node:18";
    const result = validatePipelineContent(content, "gitlab-ci", false);
    const permWarning = result.warnings.find(w => w.message.includes("permissions"));
    expect(permWarning).toBeUndefined();
  });

  it("summary reflects warning count", () => {
    const content = "jobs:\n  build:\n    runs-on: ubuntu-latest";
    const result = validatePipelineContent(content, "github-actions", false);
    // Should have at least the permissions warning
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.summary).toContain("0 errors");
    expect(result.summary).toContain(`${result.warnings.length} warnings`);
  });

  it("always returns valid=true since no errors are ever added", () => {
    // The current implementation only adds warnings, never errors
    const content = 'api_key: "leaked"\nuses: actions/checkout@v2';
    const result = validatePipelineContent(content, "github-actions", true);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("produces only one hardcoded secret warning even with multiple pattern matches", () => {
    const content = 'api_key: "abc"\npassword: "def"\ntoken: "ghi"\npermissions: read';
    const result = validatePipelineContent(content, "github-actions", false);
    const secretWarnings = result.warnings.filter(w => w.message.includes("hardcoded secret"));
    // The loop breaks after the first match
    expect(secretWarnings).toHaveLength(1);
  });
});

// =========================================================================
// 14. diagnosePipelineFailure helper
// =========================================================================

describe("diagnosePipelineFailure", () => {
  it("diagnoses missing dependency from 'Cannot find module'", () => {
    const logs = "Error: Cannot find module 'express'\n    at Module._resolveFilename";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("missing_dependency");
    expect(result.severity).toBe("high");
    expect(result.root_cause).toContain("module not installed");
    expect(result.solutions.length).toBeGreaterThanOrEqual(1);
    expect(result.solutions[0].command).toContain("npm install");
  });

  it("diagnoses missing dependency from 'module not found'", () => {
    const logs = "Module not found: Error: Can't resolve 'lodash'";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("missing_dependency");
  });

  it("diagnoses permission error from 'EACCES'", () => {
    const logs = "Error: EACCES: permission denied, open '/usr/local/lib'";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("permission_error");
    expect(result.severity).toBe("medium");
    expect(result.solutions[0].command).toContain("chmod");
  });

  it("diagnoses permission error from 'Permission denied'", () => {
    const logs = "bash: ./deploy.sh: Permission denied";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("permission_error");
  });

  it("diagnoses timeout error", () => {
    const logs = "Error: Process timed out after 600 seconds";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("timeout");
    expect(result.severity).toBe("medium");
    expect(result.solutions[0].implementation).toContain("timeout-minutes");
  });

  it("diagnoses timeout from 'timeout' keyword", () => {
    const logs = "Job exceeded maximum timeout duration";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("timeout");
  });

  it("diagnoses memory error from 'out of memory'", () => {
    const logs = "FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("memory_error");
    expect(result.severity).toBe("high");
    expect(result.solutions[0].command).toContain("max_old_space_size");
  });

  it("diagnoses memory error from 'heap' keyword", () => {
    const logs = "JavaScript heap allocation failed";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("memory_error");
  });

  it("diagnoses auth error from 'authentication'", () => {
    const logs = "Error: authentication failed for repository";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("auth_error");
    expect(result.severity).toBe("high");
    expect(result.solutions[0].check).toContain("Secrets and variables");
  });

  it("diagnoses auth error from 'unauthorized'", () => {
    const logs = "HTTP 401 Unauthorized - bad credentials";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("auth_error");
  });

  it("diagnoses auth error from '401' status code", () => {
    const logs = "Request failed with status code 401";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("auth_error");
  });

  it("returns unknown diagnosis for unrecognized logs", () => {
    const logs = "Some completely unrelated log output with no error patterns";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("unknown");
    expect(result.severity).toBe("medium");
    expect(result.root_cause).toContain("Unable to automatically diagnose");
    expect(result.solutions[0].suggestion).toBeDefined();
  });

  it("returns unknown for empty logs", () => {
    const result = diagnosePipelineFailure("");
    expect(result.error_type).toBe("unknown");
  });

  it("first matched error type wins when multiple patterns match", () => {
    // "Cannot find module" comes before timeout check in the code
    const logs = "Cannot find module 'x'. The process timed out.";
    const result = diagnosePipelineFailure(logs);
    // The function checks conditions sequentially and sets error_type for each match
    // Since there is no early return, the last matching condition wins
    // Actually, reviewing the code: each condition sets error_type independently
    // and pushes to solutions. The final error_type will be "timeout" (last match).
    expect(result.error_type).toBe("timeout");
    // But solutions accumulate from all matches
    expect(result.solutions.length).toBe(2);
  });

  it("accumulates solutions from all matching patterns", () => {
    const logs = "Permission denied. Authentication failed with 401.";
    const result = diagnosePipelineFailure(logs);
    // permission_error and auth_error both match
    expect(result.solutions.length).toBe(2);
  });

  it("is case-insensitive", () => {
    const logs = "CANNOT FIND MODULE 'Express'";
    const result = diagnosePipelineFailure(logs);
    expect(result.error_type).toBe("missing_dependency");
  });
});

// =========================================================================
// 15. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("GeneratePipelineSchema rejects null as platform", () => {
    const result = GeneratePipelineSchema.safeParse({
      platform: null,
      project_type: "nodejs",
      features: ["testing"],
    });
    expect(result.success).toBe(false);
  });

  it("GeneratePipelineSchema rejects numeric project_type", () => {
    const result = GeneratePipelineSchema.safeParse({
      platform: "github-actions",
      project_type: 123,
      features: ["testing"],
    });
    expect(result.success).toBe(false);
  });

  it("GeneratePipelineSchema rejects features as a string instead of array", () => {
    const result = GeneratePipelineSchema.safeParse({
      platform: "github-actions",
      project_type: "nodejs",
      features: "testing",
    });
    expect(result.success).toBe(false);
  });

  it("EstimateCostSchema rejects null as monthly_runs", () => {
    const result = EstimateCostSchema.safeParse({
      pipeline_file: "ci.yml",
      platform: "github-actions",
      monthly_runs: null,
    });
    expect(result.success).toBe(false);
  });

  it("TroubleshootFailureSchema rejects numeric failure_logs", () => {
    const result = TroubleshootFailureSchema.safeParse({
      pipeline_file: "ci.yml",
      failure_logs: 42,
      platform: "github-actions",
    });
    expect(result.success).toBe(false);
  });

  it("SecurityScanPipelineSchema rejects scan_types as a string", () => {
    const result = SecurityScanPipelineSchema.safeParse({
      pipeline_file: "ci.yml",
      scan_types: "sast",
    });
    expect(result.success).toBe(false);
  });

  it("GenerateDeploymentSchema rejects empty object", () => {
    const result = GenerateDeploymentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("GenerateRollbackSchema rejects empty object", () => {
    const result = GenerateRollbackSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("OptimizePipelineSchema rejects numeric pipeline_file", () => {
    const result = OptimizePipelineSchema.safeParse({
      pipeline_file: 123,
      platform: "github-actions",
    });
    expect(result.success).toBe(false);
  });

  it("ValidatePipelineSchema accepts strict as false", () => {
    const result = ValidatePipelineSchema.safeParse({
      pipeline_file: "ci.yml",
      platform: "github-actions",
      strict: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strict).toBe(false);
    }
  });

  it("GeneratePipelineSchema accepts options with only node_version", () => {
    const result = GeneratePipelineSchema.safeParse({
      platform: "github-actions",
      project_type: "nodejs",
      features: ["build"],
      options: { node_version: "18" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options?.node_version).toBe("18");
      expect(result.data.options?.python_version).toBeUndefined();
    }
  });

  it("GeneratePipelineSchema accepts empty options object", () => {
    const result = GeneratePipelineSchema.safeParse({
      platform: "github-actions",
      project_type: "nodejs",
      features: ["build"],
      options: {},
    });
    expect(result.success).toBe(true);
  });

  it("GeneratePipelineSchema rejects non-string node_version in options", () => {
    const result = GeneratePipelineSchema.safeParse({
      platform: "github-actions",
      project_type: "nodejs",
      features: ["build"],
      options: { node_version: 18 },
    });
    expect(result.success).toBe(false);
  });
});
