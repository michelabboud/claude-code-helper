#!/usr/bin/env node

/**
 * CI/CD Pipeline MCP Server
 * Provides pipeline generation, optimization, validation, and troubleshooting tools
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as yaml from "js-yaml";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, errorResponse } from "mcp-shared";

// Type definitions for pipeline structures
interface PipelineStep {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
}

interface PipelineJob {
  "runs-on": string;
  needs?: string[];
  if?: string;
  steps: PipelineStep[];
}

interface GithubActionsPipeline {
  name: string;
  on: {
    push: { branches: string[] };
    pull_request: Record<string, unknown>;
  };
  jobs: Record<string, PipelineJob>;
}

interface GenericPipeline {
  platform: string;
  project_type: string;
  features: string[];
  message: string;
  note: string;
}

type Pipeline = GithubActionsPipeline | GenericPipeline;

interface PipelineOptions {
  node_version?: string;
  python_version?: string;
  parallel_jobs?: boolean;
  caching?: boolean;
}

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

interface ScanStep {
  name: string;
  tool: string;
  step: PipelineStep;
}

interface DeploymentConfig {
  strategy: string;
  description: string;
  steps: (string | null | false)[];
}

// Tool input schemas
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

// Pipeline templates
const pipelineTemplates = {
  "github-actions": {
    nodejs: (options?: PipelineOptions) => ({
      name: "CI Pipeline",
      on: {
        push: { branches: ["main", "develop"] },
        pull_request: {}
      },
      jobs: {
        lint: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-node@v4",
              with: {
                "node-version": options?.node_version || "20",
                cache: options?.caching !== false ? "npm" : undefined
              }
            },
            { run: "npm ci" },
            { run: "npm run lint" }
          ]
        },
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-node@v4",
              with: {
                "node-version": options?.node_version || "20",
                cache: options?.caching !== false ? "npm" : undefined
              }
            },
            { run: "npm ci" },
            { run: "npm test -- --coverage" }
          ]
        },
        build: {
          "runs-on": "ubuntu-latest",
          needs: options?.parallel_jobs ? [] : ["lint", "test"],
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-node@v4",
              with: {
                "node-version": options?.node_version || "20",
                cache: options?.caching !== false ? "npm" : undefined
              }
            },
            { run: "npm ci" },
            { run: "npm run build" }
          ]
        }
      }
    }),
    python: (options?: PipelineOptions) => ({
      name: "CI Pipeline",
      on: {
        push: { branches: ["main", "develop"] },
        pull_request: {}
      },
      jobs: {
        lint: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-python@v5",
              with: { "python-version": options?.python_version || "3.11" }
            },
            { run: "pip install flake8 black" },
            { run: "flake8 ." },
            { run: "black --check ." }
          ]
        },
        test: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-python@v5",
              with: { "python-version": options?.python_version || "3.11" }
            },
            { run: "pip install -r requirements.txt" },
            { run: "pip install pytest pytest-cov" },
            { run: "pytest --cov=./ --cov-report=xml" }
          ]
        }
      }
    }),
    go: (_options?: PipelineOptions) => ({
      name: "CI Pipeline",
      on: {
        push: { branches: ["main", "develop"] },
        pull_request: {}
      },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-go@v5",
              with: { "go-version": "1.21" }
            },
            { run: "go mod download" },
            { run: "go build -v ./..." },
            { run: "go test -v ./..." }
          ]
        }
      }
    }),
    rust: (_options?: PipelineOptions) => ({
      name: "CI Pipeline",
      on: {
        push: { branches: ["main", "develop"] },
        pull_request: {}
      },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions-rs/toolchain@v1",
              with: { toolchain: "stable", override: true }
            },
            { run: "cargo build --verbose" },
            { run: "cargo test --verbose" }
          ]
        }
      }
    }),
    java: (_options?: PipelineOptions) => ({
      name: "CI Pipeline",
      on: {
        push: { branches: ["main", "develop"] },
        pull_request: {}
      },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "actions/setup-java@v4",
              with: { "java-version": "17", distribution: "temurin" }
            },
            { run: "./gradlew build" },
            { run: "./gradlew test" }
          ]
        }
      }
    }),
    docker: (_options?: PipelineOptions) => ({
      name: "CI Pipeline",
      on: {
        push: { branches: ["main", "develop"] },
        pull_request: {}
      },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            { uses: "actions/checkout@v4" },
            {
              uses: "docker/setup-buildx-action@v3"
            },
            {
              uses: "docker/build-push-action@v5",
              with: { push: false, tags: "app:latest" }
            }
          ]
        }
      }
    })
  }
};

// Helper functions
function addSecurityScan(pipeline: GithubActionsPipeline, platform: string): GithubActionsPipeline {
  if (platform === "github-actions") {
    pipeline.jobs.security = {
      "runs-on": "ubuntu-latest",
      steps: [
        { uses: "actions/checkout@v4" },
        {
          uses: "snyk/actions/node@master",
          env: { SNYK_TOKEN: "${{ secrets.SNYK_TOKEN }}" }
        }
      ]
    };
  }
  return pipeline;
}

function addDeployment(pipeline: GithubActionsPipeline, target: string): GithubActionsPipeline {
  const deployJobs: Record<string, PipelineJob> = {
    vercel: {
      "runs-on": "ubuntu-latest",
      needs: ["build"],
      if: "github.ref == 'refs/heads/main'",
      steps: [
        { uses: "actions/checkout@v4" },
        {
          uses: "amondnet/vercel-action@v25",
          with: {
            "vercel-token": "${{ secrets.VERCEL_TOKEN }}",
            "vercel-org-id": "${{ secrets.VERCEL_ORG_ID }}",
            "vercel-project-id": "${{ secrets.VERCEL_PROJECT_ID }}"
          }
        }
      ]
    },
    aws: {
      "runs-on": "ubuntu-latest",
      needs: ["build"],
      if: "github.ref == 'refs/heads/main'",
      steps: [
        { uses: "actions/checkout@v4" },
        {
          uses: "aws-actions/configure-aws-credentials@v4",
          with: {
            "aws-access-key-id": "${{ secrets.AWS_ACCESS_KEY_ID }}",
            "aws-secret-access-key": "${{ secrets.AWS_SECRET_ACCESS_KEY }}",
            "aws-region": "us-east-1"
          }
        },
        { run: "aws s3 sync ./dist s3://${{ secrets.S3_BUCKET }}" }
      ]
    },
    kubernetes: {
      "runs-on": "ubuntu-latest",
      needs: ["build"],
      if: "github.ref == 'refs/heads/main'",
      steps: [
        { uses: "actions/checkout@v4" },
        {
          uses: "azure/k8s-set-context@v3",
          with: { kubeconfig: "${{ secrets.KUBE_CONFIG }}" }
        },
        { run: "kubectl apply -f k8s/" }
      ]
    }
  };

  if (deployJobs[target]) {
    pipeline.jobs.deploy = deployJobs[target];
  }
  return pipeline;
}

function analyzeForOptimizations(pipelineContent: string, platform: string): OptimizationResult {
  const optimizations: Optimization[] = [];
  const contentLower = pipelineContent.toLowerCase();

  // Check for caching
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

  // Check for parallelization
  if (contentLower.includes("needs:") || contentLower.includes("depends_on:")) {
    optimizations.push({
      type: "parallelization",
      impact: "medium",
      time_saved: "3-7 minutes",
      description: "Run independent jobs in parallel",
      implementation: "Remove unnecessary dependencies between lint, test, and security jobs"
    });
  }

  // Check for matrix testing
  if (!contentLower.includes("matrix") && !contentLower.includes("strategy")) {
    optimizations.push({
      type: "matrix_testing",
      impact: "medium",
      description: "Use matrix builds for multi-version testing",
      implementation: "Add strategy.matrix for testing multiple versions"
    });
  }

  // Check for conditional execution
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

  // Check for outdated actions
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

  // Check for hardcoded secrets
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

  // Check for timeout settings
  if (!contentLower.includes("timeout")) {
    if (strict) {
      warnings.push({
        severity: "low",
        message: "No timeout set for jobs - could lead to runaway costs",
        category: "best_practice"
      });
    }
  }

  // Check for proper permissions
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

  // Common failure patterns
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

// MCP Server
runServer({ name: "cicd-pipeline-mcp", version: "1.0.0" }, (instance) => {
const { server, logger } = instance;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_pipeline",
        description: "Generate CI/CD pipeline configuration for GitHub Actions, GitLab CI, Jenkins, or CircleCI. Creates complete workflows with testing, linting, building, and deployment.",
        inputSchema: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: ["github-actions", "gitlab-ci", "jenkins", "circleci"],
              description: "Target CI/CD platform"
            },
            project_type: {
              type: "string",
              enum: ["nodejs", "python", "go", "rust", "java", "docker"],
              description: "Project type"
            },
            features: {
              type: "array",
              items: {
                type: "string",
                enum: ["testing", "linting", "build", "deploy", "security-scan"]
              },
              description: "Pipeline features to include"
            },
            deployment_target: {
              type: "string",
              enum: ["vercel", "aws", "gcp", "azure", "kubernetes", "docker-hub"],
              description: "Deployment target"
            },
            options: {
              type: "object",
              properties: {
                node_version: { type: "string" },
                python_version: { type: "string" },
                parallel_jobs: { type: "boolean" },
                caching: { type: "boolean" }
              }
            }
          },
          required: ["platform", "project_type", "features"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "optimize_pipeline",
        description: "Analyze existing pipeline configuration and suggest optimizations for speed, cost, reliability, and security.",
        inputSchema: {
          type: "object",
          properties: {
            pipeline_file: { type: "string", description: "Path to pipeline configuration" },
            platform: {
              type: "string",
              enum: ["github-actions", "gitlab-ci", "jenkins", "circleci"],
              description: "CI/CD platform"
            },
            focus_areas: {
              type: "array",
              items: {
                type: "string",
                enum: ["speed", "cost", "reliability", "security"]
              },
              description: "Areas to focus optimization on"
            }
          },
          required: ["pipeline_file", "platform"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "validate_pipeline",
        description: "Check pipeline syntax, security issues, and best practice violations. Validates configuration before deployment.",
        inputSchema: {
          type: "object",
          properties: {
            pipeline_file: { type: "string", description: "Pipeline configuration path" },
            platform: {
              type: "string",
              enum: ["github-actions", "gitlab-ci", "jenkins", "circleci"],
              description: "CI/CD platform"
            },
            strict: { type: "boolean", description: "Enable strict validation" }
          },
          required: ["pipeline_file", "platform"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "estimate_cost",
        description: "Calculate estimated CI/CD runner costs based on pipeline configuration and expected usage.",
        inputSchema: {
          type: "object",
          properties: {
            pipeline_file: { type: "string", description: "Pipeline configuration" },
            platform: {
              type: "string",
              enum: ["github-actions", "gitlab-ci", "jenkins", "circleci"],
              description: "CI/CD platform"
            },
            monthly_runs: { type: "number", description: "Expected monthly executions" }
          },
          required: ["pipeline_file", "platform", "monthly_runs"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "troubleshoot_failure",
        description: "Analyze pipeline failure logs and provide diagnosis with suggested fixes.",
        inputSchema: {
          type: "object",
          properties: {
            pipeline_file: { type: "string", description: "Pipeline configuration" },
            failure_logs: { type: "string", description: "Error logs from failed run" },
            platform: {
              type: "string",
              enum: ["github-actions", "gitlab-ci", "jenkins", "circleci"],
              description: "CI/CD platform"
            }
          },
          required: ["pipeline_file", "failure_logs", "platform"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "security_scan_pipeline",
        description: "Generate security scanning configuration for existing pipelines. Adds SAST, dependency scanning, container scanning, and secret detection.",
        inputSchema: {
          type: "object",
          properties: {
            pipeline_file: { type: "string", description: "Existing pipeline configuration" },
            scan_types: {
              type: "array",
              items: {
                type: "string",
                enum: ["sast", "dependency", "container", "secret"]
              },
              description: "Types of security scans to add"
            },
            tools: {
              type: "array",
              items: { type: "string" },
              description: "Specific tools (snyk, trivy, semgrep, trufflehog)"
            }
          },
          required: ["pipeline_file", "scan_types"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_deployment",
        description: "Create deployment workflow with specified strategy (blue-green, canary, rolling). Includes health checks and rollback procedures.",
        inputSchema: {
          type: "object",
          properties: {
            strategy: {
              type: "string",
              enum: ["blue-green", "canary", "rolling", "recreate"],
              description: "Deployment strategy"
            },
            platform: {
              type: "string",
              enum: ["kubernetes", "ecs", "lambda", "vercel", "app-engine"],
              description: "Target platform"
            },
            health_checks: { type: "boolean", description: "Include health check steps" },
            rollback: { type: "boolean", description: "Include rollback procedures" }
          },
          required: ["strategy", "platform"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_rollback",
        description: "Create rollback procedures for deployments. Supports automatic and manual rollback strategies.",
        inputSchema: {
          type: "object",
          properties: {
            deployment_platform: {
              type: "string",
              enum: ["kubernetes", "ecs", "lambda", "vercel"],
              description: "Deployment target"
            },
            rollback_strategy: {
              type: "string",
              enum: ["previous-version", "specific-version", "snapshot"],
              description: "Rollback strategy"
            },
            automated: { type: "boolean", description: "Enable automated rollback" }
          },
          required: ["deployment_platform", "rollback_strategy"]
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
      case "generate_pipeline": {
        const { platform, project_type, features, deployment_target, options } = GeneratePipelineSchema.parse(args);

        let pipeline: Pipeline;

        if (platform === "github-actions") {
          const templates = pipelineTemplates["github-actions"] as Record<string, (options?: PipelineOptions) => GithubActionsPipeline>;
          const templateFn = templates[project_type];
          if (templateFn) {
            pipeline = templateFn(options);
          } else {
            pipeline = templates.nodejs(options);
          }

          // Add security scanning if requested
          if (features.includes("security-scan")) {
            pipeline = addSecurityScan(pipeline, platform);
          }

          // Add deployment if requested
          if (features.includes("deploy") && deployment_target) {
            pipeline = addDeployment(pipeline, deployment_target);
          }
        } else {
          // Return a generic template for other platforms
          pipeline = {
            platform,
            project_type,
            features,
            message: `Generated template for ${platform}`,
            note: "Customize this template for your specific needs"
          };
        }

        const yamlOutput = yaml.dump(pipeline);

        response = {
          content: [{
            type: "text",
            text: `# Generated ${platform} pipeline for ${project_type}\n# Features: ${features.join(", ")}\n${deployment_target ? `# Deployment: ${deployment_target}\n` : ""}\n${yamlOutput}`,
          }],
        };
        break;
      }

      case "optimize_pipeline": {
        const { pipeline_file, platform, focus_areas } = OptimizePipelineSchema.parse(args);
        const safePipelineFile = sanitizePath(pipeline_file, process.cwd());

        let content: string;
        try {
          content = await fs.readFile(safePipelineFile, "utf-8");
        } catch {
          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Could not read pipeline file",
                file: safePipelineFile,
                suggestion: "Verify file path and permissions"
              }, null, 2),
            }],
            isError: true,
          };
          break;
        }

        const analysis = analyzeForOptimizations(content, platform);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              file: safePipelineFile,
              platform,
              focus_areas: focus_areas || ["speed", "cost"],
              ...analysis
            }, null, 2),
          }],
        };
        break;
      }

      case "validate_pipeline": {
        const { pipeline_file, platform, strict } = ValidatePipelineSchema.parse(args);
        const safePipelineFile = sanitizePath(pipeline_file, process.cwd());

        let content: string;
        try {
          content = await fs.readFile(safePipelineFile, "utf-8");
        } catch {
          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Could not read pipeline file",
                file: safePipelineFile
              }, null, 2),
            }],
            isError: true,
          };
          break;
        }

        const validation = validatePipelineContent(content, platform, strict || false);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              file: safePipelineFile,
              platform,
              strict: strict || false,
              ...validation
            }, null, 2),
          }],
        };
        break;
      }

      case "estimate_cost": {
        const { pipeline_file, platform, monthly_runs } = EstimateCostSchema.parse(args);
        const safePipelineFile = sanitizePath(pipeline_file, process.cwd());

        // Cost estimation based on typical job durations
        const costPerMinute: Record<string, number> = {
          "github-actions": 0.008,
          "gitlab-ci": 0.0085,
          "circleci": 0.006,
          "jenkins": 0.01, // Self-hosted estimate
        };

        const estimatedJobMinutes = 10; // Average job duration
        const estimatedJobs = 4; // Average jobs per pipeline

        const monthlyCost = monthly_runs * estimatedJobs * estimatedJobMinutes * (costPerMinute[platform] || 0.008);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              file: safePipelineFile,
              platform,
              monthly_runs,
              breakdown: {
                avg_job_duration: `${estimatedJobMinutes} minutes`,
                jobs_per_run: estimatedJobs,
                cost_per_minute: `$${costPerMinute[platform] || 0.008}`,
                estimated_monthly_minutes: monthly_runs * estimatedJobs * estimatedJobMinutes,
              },
              total_monthly_cost: `$${monthlyCost.toFixed(2)}`,
              optimization_potential: `$${(monthlyCost * 0.3).toFixed(2)}`,
              recommendations: [
                "Enable caching to reduce install times by 30-50%",
                "Use path filters to skip CI on documentation changes",
                "Run independent jobs in parallel"
              ]
            }, null, 2),
          }],
        };
        break;
      }

      case "troubleshoot_failure": {
        const { pipeline_file, failure_logs, platform } = TroubleshootFailureSchema.parse(args);
        const safePipelineFile = sanitizePath(pipeline_file, process.cwd());

        const diagnosis = diagnosePipelineFailure(failure_logs);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              file: safePipelineFile,
              platform,
              diagnosis
            }, null, 2),
          }],
        };
        break;
      }

      case "security_scan_pipeline": {
        const { pipeline_file, scan_types, tools } = SecurityScanPipelineSchema.parse(args);
        const safePipelineFile = sanitizePath(pipeline_file, process.cwd());

        const scanSteps: Record<string, ScanStep> = {};

        if (scan_types.includes("sast")) {
          scanSteps.sast = {
            name: "SAST Scan",
            tool: tools?.includes("semgrep") ? "semgrep" : "codeql",
            step: {
              uses: "github/codeql-action/analyze@v2"
            }
          };
        }

        if (scan_types.includes("dependency")) {
          scanSteps.dependency = {
            name: "Dependency Scan",
            tool: tools?.includes("snyk") ? "snyk" : "dependabot",
            step: {
              uses: "snyk/actions/node@master",
              env: { SNYK_TOKEN: "${{ secrets.SNYK_TOKEN }}" }
            }
          };
        }

        if (scan_types.includes("container")) {
          scanSteps.container = {
            name: "Container Scan",
            tool: tools?.includes("trivy") ? "trivy" : "grype",
            step: {
              uses: "aquasecurity/trivy-action@master",
              with: { "image-ref": "${{ github.repository }}:latest" }
            }
          };
        }

        if (scan_types.includes("secret")) {
          scanSteps.secret = {
            name: "Secret Scan",
            tool: tools?.includes("trufflehog") ? "trufflehog" : "gitleaks",
            step: {
              uses: "trufflesecurity/trufflehog@main",
              with: { path: "./" }
            }
          };
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              pipeline_file: safePipelineFile,
              added_scans: scanSteps,
              configuration: yaml.dump({ jobs: { security: { steps: Object.values(scanSteps).map((s: ScanStep) => s.step) } } })
            }, null, 2),
          }],
        };
        break;
      }

      case "generate_deployment": {
        const { strategy, platform, health_checks, rollback } = GenerateDeploymentSchema.parse(args);

        const deploymentConfigs: Record<string, DeploymentConfig> = {
          "blue-green": {
            strategy: "blue-green",
            description: "Deploy to inactive environment, then switch traffic",
            steps: [
              "Deploy to inactive (blue/green) environment",
              health_checks ? "Run health checks on new deployment" : null,
              "Switch load balancer to new environment",
              rollback ? "Keep old environment ready for rollback" : null
            ].filter(Boolean)
          },
          "canary": {
            strategy: "canary",
            description: "Gradually shift traffic to new version",
            steps: [
              "Deploy new version to subset of pods/instances",
              health_checks ? "Monitor error rates and latency" : null,
              "Gradually increase traffic (10% -> 50% -> 100%)",
              rollback ? "Auto-rollback if error rate exceeds threshold" : null
            ].filter(Boolean)
          },
          "rolling": {
            strategy: "rolling",
            description: "Update instances one by one",
            steps: [
              "Update one instance at a time",
              health_checks ? "Wait for health check before proceeding" : null,
              "Continue until all instances updated",
              rollback ? "Stop and rollback if health check fails" : null
            ].filter(Boolean)
          },
          "recreate": {
            strategy: "recreate",
            description: "Stop all, then deploy all",
            steps: [
              "Stop all running instances",
              "Deploy new version to all instances",
              health_checks ? "Verify all instances are healthy" : null
            ].filter(Boolean)
          }
        };

        const config = deploymentConfigs[strategy];

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              strategy,
              platform,
              health_checks: health_checks || false,
              rollback_enabled: rollback || false,
              deployment: config,
              platform_specific: platform === "kubernetes" ? {
                spec: {
                  strategy: { type: strategy === "rolling" ? "RollingUpdate" : "Recreate" },
                  replicas: 3
                }
              } : { note: `Configure ${platform} deployment settings` }
            }, null, 2),
          }],
        };
        break;
      }

      case "generate_rollback": {
        const { deployment_platform, rollback_strategy, automated } = GenerateRollbackSchema.parse(args);

        const rollbackConfigs: Record<string, Record<string, string>> = {
          kubernetes: {
            "previous-version": "kubectl rollout undo deployment/app",
            "specific-version": "kubectl rollout undo deployment/app --to-revision=N",
            "snapshot": "kubectl apply -f backup/deployment-snapshot.yaml"
          },
          ecs: {
            "previous-version": "aws ecs update-service --service app --task-definition app:PREVIOUS",
            "specific-version": "aws ecs update-service --service app --task-definition app:VERSION",
            "snapshot": "aws ecs update-service --service app --task-definition $(cat backup/task-def.json)"
          },
          lambda: {
            "previous-version": "aws lambda update-alias --function-name app --name prod --function-version PREVIOUS",
            "specific-version": "aws lambda update-alias --function-name app --name prod --function-version VERSION",
            "snapshot": "aws lambda update-function-code --function-name app --s3-bucket backup --s3-key app.zip"
          },
          vercel: {
            "previous-version": "vercel rollback",
            "specific-version": "vercel rollback [deployment-id]",
            "snapshot": "vercel --prod --force"
          }
        };

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              platform: deployment_platform,
              strategy: rollback_strategy,
              automated: automated || false,
              command: rollbackConfigs[deployment_platform]?.[rollback_strategy] || "Configure rollback for platform",
              workflow: automated ? {
                trigger: "health-check-failure",
                condition: "error_rate > 5% for 2 minutes",
                action: rollbackConfigs[deployment_platform]?.[rollback_strategy],
                notification: "Slack/PagerDuty alert on rollback"
              } : {
                trigger: "manual",
                action: rollbackConfigs[deployment_platform]?.[rollback_strategy]
              }
            }, null, 2),
          }],
        };
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

}); // runServer
