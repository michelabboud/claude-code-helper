#!/usr/bin/env node

/**
 * n8n Automation MCP Server
 * Provides n8n workflow generation, optimization, and troubleshooting tools
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, errorResponse } from "mcp-shared";

const SERVER_NAME = "n8n-automation-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🟠";

// Interfaces for n8n workflow types
interface N8nNodeParameters {
  [key: string]: unknown;
}

interface N8nNodeCredentials {
  [key: string]: string;
}

interface N8nNode {
  type: string;
  typeVersion: number;
  name: string;
  position: number[];
  parameters: N8nNodeParameters;
  credentials?: N8nNodeCredentials;
}

interface N8nNodeTemplate {
  type: string;
  typeVersion: number;
  parameters: N8nNodeParameters;
  credentials?: N8nNodeCredentials;
}

interface N8nConnection {
  main: Array<Array<{ node: string; type: string; index: number }>>;
}

interface N8nWorkflow {
  name?: string;
  nodes?: N8nNode[];
  connections?: Record<string, N8nConnection>;
  [key: string]: unknown;
}

interface WorkflowAnalysis {
  total_nodes: number;
  node_types: string[];
  has_error_handling: boolean;
  has_retry_logic: boolean;
  estimated_execution_time: string;
  complexity: string;
}

interface Optimization {
  type: string;
  impact: string;
  description: string;
  implementation: string;
  expected_improvement: string;
}

interface DiagnosisSolution {
  priority: string;
  fix: string;
  implementation?: Record<string, unknown>;
  resources?: string[];
}

interface Diagnosis {
  error_type: string;
  severity: string;
  root_cause?: string;
  solutions: DiagnosisSolution[];
}

interface IntegrationSuggestions {
  recommended_workflow: {
    trigger: string;
    nodes: Array<{ name: string; purpose: string }>;
  };
  alternative_tools: Array<{ tool: string; reason: string }>;
}

interface DataMapping {
  output: string;
  expression: string;
  type: string;
}

interface TransformExpression {
  type: string;
  example: string;
  description: string;
}

// Tool input schemas
const GenerateWorkflowSchema = z.object({
  workflow_type: z.enum(["scheduled", "webhook", "event-driven"]).describe("Workflow trigger type"),
  services: z.array(z.string()).describe("Services to integrate"),
  trigger: z.string().describe("Trigger configuration"),
  actions: z.array(z.string()).describe("Actions to perform"),
});

const OptimizeWorkflowSchema = z.object({
  workflow: z.record(z.string(), z.unknown()).describe("Current workflow JSON"),
  focus_areas: z.array(z.enum(["speed", "reliability", "cost"])).optional().describe("Optimization focus"),
});

const TroubleshootWorkflowSchema = z.object({
  workflow: z.record(z.string(), z.unknown()).describe("Workflow configuration"),
  error_log: z.string().describe("Error messages"),
  execution_data: z.record(z.string(), z.unknown()).optional().describe("Last execution data"),
});

const GenerateErrorWorkflowSchema = z.object({
  main_workflow_id: z.string().describe("ID of main workflow"),
  notification_channels: z.array(z.string()).describe("Alert destinations"),
  retry_strategy: z.enum(["immediate", "exponential_backoff", "fixed_delay"]).describe("Retry approach"),
});

const SuggestIntegrationsSchema = z.object({
  use_case: z.string().describe("Automation goal description"),
  existing_tools: z.array(z.string()).optional().describe("Current tools in use"),
});

const GenerateDataTransformationSchema = z.object({
  input_format: z.record(z.string(), z.unknown()).describe("Source data structure"),
  output_format: z.record(z.string(), z.unknown()).describe("Target data structure"),
  transformations: z.array(z.string()).describe("Required transformations"),
});

// n8n node templates
const nodeTemplates: Record<string, N8nNodeTemplate> = {
  webhook: {
    type: "n8n-nodes-base.webhook",
    typeVersion: 1,
    parameters: {
      path: "webhook-endpoint",
      responseMode: "onReceived",
      options: {}
    }
  },
  schedule: {
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1,
    parameters: {
      rule: { interval: [{ field: "hours", hoursInterval: 1 }] }
    }
  },
  slack: {
    type: "n8n-nodes-base.slack",
    typeVersion: 2,
    parameters: {
      operation: "message",
      channel: "#notifications",
      text: "={{$json[\"message\"]}}"
    },
    credentials: { slackApi: "slack_credentials" }
  },
  gmail: {
    type: "n8n-nodes-base.gmail",
    typeVersion: 2,
    parameters: {
      operation: "send",
      sendTo: "={{$json[\"email\"]}}",
      subject: "Notification",
      message: "={{$json[\"message\"]}}"
    },
    credentials: { gmailOAuth2: "gmail_credentials" }
  },
  airtable: {
    type: "n8n-nodes-base.airtable",
    typeVersion: 2,
    parameters: {
      operation: "append",
      application: "={{$credentials.airtableBase}}",
      table: "Records",
      options: {}
    },
    credentials: { airtableApi: "airtable_credentials" }
  },
  httpRequest: {
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    parameters: {
      method: "GET",
      url: "https://api.example.com/data",
      options: {}
    }
  },
  "if": {
    type: "n8n-nodes-base.if",
    typeVersion: 1,
    parameters: {
      conditions: {
        boolean: [
          { value1: "={{$json[\"condition\"]}}", value2: true }
        ]
      }
    }
  },
  set: {
    type: "n8n-nodes-base.set",
    typeVersion: 3,
    parameters: {
      mode: "manual",
      duplicateItem: false,
      assignments: {
        assignments: []
      }
    }
  },
  spreadsheet: {
    type: "n8n-nodes-base.spreadsheetFile",
    typeVersion: 2,
    parameters: {
      operation: "read",
      fileFormat: "csv"
    }
  },
  database: {
    type: "n8n-nodes-base.postgres",
    typeVersion: 2,
    parameters: {
      operation: "select",
      table: "table_name"
    },
    credentials: { postgres: "postgres_credentials" }
  }
};

// Helper functions
function generateWorkflowNodes(services: string[], actions: string[], trigger: string): N8nNode[] {
  const nodes: N8nNode[] = [];
  const position = [250, 300];

  // Add trigger node
  if (trigger === "webhook") {
    nodes.push({
      ...nodeTemplates.webhook,
      name: "Webhook Trigger",
      position: [...position]
    });
  } else if (trigger === "cron" || trigger === "schedule") {
    nodes.push({
      ...nodeTemplates.schedule,
      name: "Schedule Trigger",
      position: [...position]
    });
  }
  position[0] += 200;

  // Add processing nodes
  for (const action of actions) {
    if (action.includes("parse") || action.includes("transform")) {
      nodes.push({
        ...nodeTemplates.set,
        name: "Transform Data",
        position: [...position],
        parameters: {
          ...nodeTemplates.set.parameters,
          assignments: {
            assignments: [
              { name: "processed", value: "={{$json}}", type: "object" }
            ]
          }
        }
      });
      position[0] += 200;
    }

    if (action.includes("filter") || action.includes("condition")) {
      nodes.push({
        ...nodeTemplates.if,
        name: "Filter Condition",
        position: [...position]
      });
      position[0] += 200;
    }
  }

  // Add service nodes
  for (const service of services) {
    const serviceLower = service.toLowerCase();
    if (nodeTemplates[serviceLower]) {
      nodes.push({
        ...nodeTemplates[serviceLower],
        name: service.charAt(0).toUpperCase() + service.slice(1),
        position: [...position]
      });
      position[0] += 200;
    }
  }

  return nodes;
}

function generateConnections(nodes: N8nNode[]): Record<string, N8nConnection> {
  const connections: Record<string, N8nConnection> = {};

  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];

    connections[currentNode.name] = {
      main: [[{ node: nextNode.name, type: "main", index: 0 }]]
    };
  }

  return connections;
}

function analyzeWorkflow(workflow: N8nWorkflow): WorkflowAnalysis {
  const nodes: N8nNode[] = (workflow.nodes as N8nNode[]) || [];

  const analysis: WorkflowAnalysis = {
    total_nodes: nodes.length,
    node_types: nodes.map((n: N8nNode) => n.type),
    has_error_handling: nodes.some((n: N8nNode) => n.name?.toLowerCase().includes("error")),
    has_retry_logic: nodes.some((n: N8nNode) =>
      n.parameters?.retryOnFail || n.name?.toLowerCase().includes("retry")
    ),
    estimated_execution_time: `${nodes.length * 0.5}s average`,
    complexity: nodes.length > 10 ? "high" : nodes.length > 5 ? "medium" : "low"
  };

  return analysis;
}

function generateOptimizations(workflow: N8nWorkflow, focusAreas: string[]): Optimization[] {
  const optimizations: Optimization[] = [];
  const nodes: N8nNode[] = (workflow.nodes as N8nNode[]) || [];

  // Speed optimizations
  if (focusAreas.includes("speed")) {
    // Check for sequential API calls that could be parallel
    const httpNodes = nodes.filter((n: N8nNode) => n.type?.includes("httpRequest"));
    if (httpNodes.length > 2) {
      optimizations.push({
        type: "parallelization",
        impact: "high",
        description: "Multiple HTTP requests can run in parallel",
        implementation: "Use Split In Batches node to process multiple requests simultaneously",
        expected_improvement: "40-60% faster execution"
      });
    }

    // Check for missing caching
    optimizations.push({
      type: "caching",
      impact: "medium",
      description: "Cache frequently accessed data",
      implementation: "Use Redis or Function node to cache API responses",
      expected_improvement: "Reduced API calls by 50%"
    });
  }

  // Reliability optimizations
  if (focusAreas.includes("reliability")) {
    // Check for error handling
    const hasErrorHandler = nodes.some((n: N8nNode) =>
      n.type?.includes("errorTrigger") || n.name?.toLowerCase().includes("error")
    );

    if (!hasErrorHandler) {
      optimizations.push({
        type: "error_handling",
        impact: "critical",
        description: "Add error handling workflow",
        implementation: "Create Error Trigger workflow with notifications",
        expected_improvement: "Better failure visibility and recovery"
      });
    }

    // Check for retry logic
    optimizations.push({
      type: "retry_logic",
      impact: "high",
      description: "Add retry with exponential backoff for API calls",
      implementation: "Enable 'Retry On Fail' with exponential backoff settings",
      expected_improvement: "Higher success rate for transient failures"
    });
  }

  // Cost optimizations
  if (focusAreas.includes("cost")) {
    optimizations.push({
      type: "batching",
      impact: "medium",
      description: "Batch API calls to reduce request count",
      implementation: "Use Split In Batches node with appropriate batch size",
      expected_improvement: "60-80% fewer API calls"
    });
  }

  return optimizations;
}

function diagnoseWorkflowError(errorLog: string, _workflow: N8nWorkflow): Diagnosis {
  const logLower = errorLog.toLowerCase();
  const diagnosis: Diagnosis = {
    error_type: "unknown",
    severity: "medium",
    solutions: []
  };

  // Connection/Timeout errors
  if (logLower.includes("timeout") || logLower.includes("timed out")) {
    diagnosis.error_type = "timeout";
    diagnosis.severity = "high";
    diagnosis.root_cause = "Operation exceeded time limit";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Increase timeout settings or batch large operations",
      implementation: {
        node_setting: "timeout",
        value: 60000,
        alternative: "Split data into smaller batches"
      }
    });
  }

  // Authentication errors
  if (logLower.includes("unauthorized") || logLower.includes("401") || logLower.includes("authentication")) {
    diagnosis.error_type = "authentication";
    diagnosis.severity = "high";
    diagnosis.root_cause = "Invalid or expired credentials";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Update or refresh API credentials",
      implementation: {
        action: "Re-authorize the credential in n8n settings",
        check: "Verify API key/token is still valid"
      }
    });
  }

  // Rate limiting
  if (logLower.includes("rate limit") || logLower.includes("429") || logLower.includes("too many requests")) {
    diagnosis.error_type = "rate_limit";
    diagnosis.severity = "medium";
    diagnosis.root_cause = "API rate limit exceeded";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Add delays between requests and batch operations",
      implementation: {
        add_nodes: ["Wait", "Split In Batches"],
        configuration: {
          wait_time: "1-5 seconds",
          batch_size: 10
        }
      }
    });
  }

  // Data/Schema errors
  if (logLower.includes("undefined") || logLower.includes("cannot read property") || logLower.includes("json")) {
    diagnosis.error_type = "data_error";
    diagnosis.severity = "medium";
    diagnosis.root_cause = "Unexpected data format or missing fields";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Add data validation and null checks",
      implementation: {
        add_nodes: ["IF", "Set"],
        validation: "Check for required fields before processing"
      }
    });
  }

  // Connection errors
  if (logLower.includes("econnrefused") || logLower.includes("network") || logLower.includes("connection")) {
    diagnosis.error_type = "connection_error";
    diagnosis.severity = "high";
    diagnosis.root_cause = "Unable to reach external service";
    diagnosis.solutions.push({
      priority: "high",
      fix: "Check service availability and network configuration",
      implementation: {
        checks: ["Verify service URL", "Check firewall rules", "Test connectivity"]
      }
    });
  }

  if (diagnosis.solutions.length === 0) {
    diagnosis.solutions.push({
      priority: "medium",
      fix: "Review full error log and check n8n community for similar issues",
      resources: [
        "https://community.n8n.io/",
        "https://docs.n8n.io/hosting/logging-monitoring/"
      ]
    });
  }

  return diagnosis;
}

function generateErrorWorkflow(mainWorkflowId: string, channels: string[], retryStrategy: string): Record<string, unknown> {
  const nodes: N8nNode[] = [];
  const position = [250, 300];

  // Error trigger
  nodes.push({
    type: "n8n-nodes-base.errorTrigger",
    typeVersion: 1,
    name: "Error Trigger",
    position: [...position],
    parameters: {}
  });
  position[0] += 200;

  // Format error message
  nodes.push({
    type: "n8n-nodes-base.set",
    typeVersion: 3,
    name: "Format Error",
    position: [...position],
    parameters: {
      mode: "manual",
      assignments: {
        assignments: [
          { name: "workflow_id", value: mainWorkflowId, type: "string" },
          { name: "error_message", value: "={{$json.error.message}}", type: "string" },
          { name: "timestamp", value: "={{$now.toISO()}}", type: "string" }
        ]
      }
    }
  });
  position[0] += 200;

  // Add notification nodes for each channel
  for (const channel of channels) {
    if (channel.toLowerCase() === "slack") {
      nodes.push({
        type: "n8n-nodes-base.slack",
        typeVersion: 2,
        name: "Slack Alert",
        position: [position[0], position[1] - 100],
        parameters: {
          operation: "message",
          channel: "#alerts",
          text: ":rotating_light: Workflow Error\nWorkflow: {{$json.workflow_id}}\nError: {{$json.error_message}}\nTime: {{$json.timestamp}}"
        },
        credentials: { slackApi: "slack_credentials" }
      });
    }

    if (channel.toLowerCase() === "email") {
      nodes.push({
        type: "n8n-nodes-base.emailSend",
        typeVersion: 2,
        name: "Email Alert",
        position: [position[0], position[1] + 100],
        parameters: {
          fromEmail: "alerts@example.com",
          toEmail: "team@example.com",
          subject: "Workflow Error Alert",
          text: "Workflow {{$json.workflow_id}} failed.\n\nError: {{$json.error_message}}\nTime: {{$json.timestamp}}"
        },
        credentials: { smtp: "smtp_credentials" }
      });
    }
  }
  position[0] += 200;

  // Add retry logic based on strategy
  const retryConfig: Record<string, Record<string, unknown>> = {
    immediate: { wait: 0, maxRetries: 3 },
    exponential_backoff: { wait: "2^retryCount seconds", maxRetries: 5 },
    fixed_delay: { wait: 30, maxRetries: 3 }
  };

  return {
    name: `Error Handler for ${mainWorkflowId}`,
    nodes,
    connections: generateConnections(nodes),
    settings: {
      errorWorkflow: mainWorkflowId
    },
    retry_configuration: retryConfig[retryStrategy],
    active: true
  };
}

function suggestIntegrations(useCase: string, existingTools: string[]): IntegrationSuggestions {
  const useCaseLower = useCase.toLowerCase();
  const suggestions: IntegrationSuggestions = {
    recommended_workflow: { trigger: "", nodes: [] },
    alternative_tools: []
  };

  // Customer support automation
  if (useCaseLower.includes("support") || useCaseLower.includes("ticket") || useCaseLower.includes("helpdesk")) {
    suggestions.recommended_workflow = {
      trigger: "Email/Webhook Trigger",
      nodes: [
        { name: "Email Trigger", purpose: "Watch for new support emails" },
        { name: "AI Classifier", purpose: "Categorize ticket urgency and type" },
        { name: "Route by Category", purpose: "Direct to appropriate team" },
        { name: "Ticketing System", purpose: "Create/update ticket" },
        { name: "Notification", purpose: "Alert assigned team member" }
      ]
    };
    if (!existingTools?.includes("zendesk")) {
      suggestions.alternative_tools.push({
        tool: "Freshdesk",
        reason: "Simpler API and lower cost alternative"
      });
    }
  }

  // Data sync automation
  if (useCaseLower.includes("sync") || useCaseLower.includes("backup") || useCaseLower.includes("transfer")) {
    suggestions.recommended_workflow = {
      trigger: "Schedule Trigger (cron)",
      nodes: [
        { name: "Schedule Trigger", purpose: "Run at specified intervals" },
        { name: "Source API", purpose: "Fetch data from source" },
        { name: "Transform", purpose: "Map and clean data" },
        { name: "Destination API", purpose: "Push to target system" },
        { name: "Log Results", purpose: "Track sync history" }
      ]
    };
  }

  // Lead/CRM automation
  if (useCaseLower.includes("lead") || useCaseLower.includes("crm") || useCaseLower.includes("sales")) {
    suggestions.recommended_workflow = {
      trigger: "Webhook/Form Submission",
      nodes: [
        { name: "Webhook", purpose: "Receive lead data from form" },
        { name: "Enrich Data", purpose: "Add company info via Clearbit/similar" },
        { name: "CRM", purpose: "Create contact in CRM" },
        { name: "Notification", purpose: "Alert sales team" },
        { name: "Email Sequence", purpose: "Start nurturing campaign" }
      ]
    };
  }

  // Social media automation
  if (useCaseLower.includes("social") || useCaseLower.includes("twitter") || useCaseLower.includes("post")) {
    suggestions.recommended_workflow = {
      trigger: "Schedule or RSS Trigger",
      nodes: [
        { name: "Content Source", purpose: "Get content to share" },
        { name: "AI Generate", purpose: "Create variations for platforms" },
        { name: "Social Platforms", purpose: "Post to multiple networks" },
        { name: "Analytics", purpose: "Track engagement" }
      ]
    };
  }

  // Default suggestion
  if (suggestions.recommended_workflow.nodes.length === 0) {
    suggestions.recommended_workflow = {
      trigger: "Determine based on use case",
      nodes: [
        { name: "Trigger", purpose: "Start workflow (webhook, schedule, or event)" },
        { name: "Process", purpose: "Transform and validate data" },
        { name: "Action", purpose: "Perform main operation" },
        { name: "Notify", purpose: "Send confirmation/alert" }
      ]
    };
  }

  return suggestions;
}

function generateDataTransformation(inputFormat: Record<string, unknown>, outputFormat: Record<string, unknown>, transformations: string[]): Record<string, unknown> {
  const mappings: DataMapping[] = [];
  const expressions: TransformExpression[] = [];

  // Generate mappings from input to output structure
  const inputKeys = Object.keys(inputFormat);
  const outputKeys = Object.keys(outputFormat);

  for (const outKey of outputKeys) {
    // Try to find matching input key
    const matchingInput = inputKeys.find(inKey =>
      inKey.toLowerCase() === outKey.toLowerCase() ||
      inKey.includes(outKey) ||
      outKey.includes(inKey)
    );

    if (matchingInput) {
      mappings.push({
        output: outKey,
        expression: `={{$json["${matchingInput}"]}}`,
        type: typeof outputFormat[outKey]
      });
    } else {
      // Check nested properties
      for (const inKey of inputKeys) {
        const inputValue = inputFormat[inKey];
        if (typeof inputValue === "object" && inputValue !== null) {
          for (const nestedKey of Object.keys(inputValue as Record<string, unknown>)) {
            if (nestedKey.toLowerCase() === outKey.toLowerCase()) {
              mappings.push({
                output: outKey,
                expression: `={{$json["${inKey}"]["${nestedKey}"]}}`,
                type: typeof outputFormat[outKey]
              });
            }
          }
        }
      }
    }
  }

  // Generate transformation expressions
  for (const transform of transformations) {
    if (transform.includes("concatenate") || transform.includes("merge")) {
      expressions.push({
        type: "concatenation",
        example: '={{$json["firstName"] + " " + $json["lastName"]}}',
        description: "Combine multiple fields"
      });
    }
    if (transform.includes("format") || transform.includes("phone")) {
      expressions.push({
        type: "formatting",
        example: '={{"+1-" + $json["phone"].replace(/[^0-9]/g, "")}}',
        description: "Format string values"
      });
    }
    if (transform.includes("date") || transform.includes("time")) {
      expressions.push({
        type: "date_formatting",
        example: '={{$json["date"].toLocaleDateString("en-US")}}',
        description: "Format dates"
      });
    }
    if (transform.includes("calculate") || transform.includes("math")) {
      expressions.push({
        type: "calculation",
        example: '={{$json["price"] * $json["quantity"]}}',
        description: "Mathematical operations"
      });
    }
  }

  // Generate n8n Set node configuration
  const setNodeConfig = {
    type: "n8n-nodes-base.set",
    typeVersion: 3,
    name: "Transform Data",
    parameters: {
      mode: "manual",
      duplicateItem: false,
      assignments: {
        assignments: mappings.map(m => ({
          id: `assign_${m.output}`,
          name: m.output,
          value: m.expression,
          type: m.type === "string" ? "string" : m.type === "number" ? "number" : "string"
        }))
      }
    }
  };

  return {
    input_structure: inputFormat,
    output_structure: outputFormat,
    mappings,
    transformation_expressions: expressions,
    n8n_node_config: setNodeConfig,
    usage_notes: [
      "Test with sample data before production use",
      "Add null checks for optional fields",
      "Consider edge cases in data formats"
    ]
  };
}

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**n8n workflow automation** — generate workflows, optimize them, troubleshoot failures, suggest integrations, transform data.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`generate_workflow\` | Generate n8n workflow with trigger, processing, and action nodes |`,
    `| \`optimize_workflow\` | Analyze workflow and suggest speed, reliability, and cost optimizations |`,
    `| \`troubleshoot_workflow\` | Diagnose n8n workflow failures and provide solutions |`,
    `| \`generate_error_workflow\` | Create error handling and monitoring workflow with notifications |`,
    `| \`suggest_integrations\` | Suggest n8n nodes and integrations based on use case description |`,
    `| \`generate_data_transformation\` | Create data transformation logic mapping source to target format |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                                       → Quick greeting + status check`,
    `hello {"verbose": true}                                        → Full server info and tool catalog`,
    `generate_workflow {"workflow_type": "webhook", "services": ["slack"], "trigger": "webhook", "actions": ["transform"]}  → Generate workflow`,
    `optimize_workflow {"workflow": {...}, "focus_areas": ["speed", "reliability"]}   → Optimize workflow`,
    `troubleshoot_workflow {"workflow": {...}, "error_log": "..."}                     → Troubleshoot failure`,
    `generate_error_workflow {"main_workflow_id": "123", "notification_channels": ["slack"], "retry_strategy": "exponential_backoff"}  → Error handler`,
    `suggest_integrations {"use_case": "sync CRM leads to Slack"}                     → Suggest integrations`,
    `generate_data_transformation {"input_format": {...}, "output_format": {...}, "transformations": ["concatenate"]}  → Transform data`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: Apache-2.0`,
  ].join("\n");
}

runServer({ name: "n8n-automation-mcp", version: "1.0.0" }, (instance) => {
const { server, logger } = instance;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_workflow",
        description: "Generate n8n workflow configuration for automation scenarios. Creates complete workflow with trigger, processing, and action nodes.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_type: {
              type: "string",
              enum: ["scheduled", "webhook", "event-driven"],
              description: "Workflow trigger type"
            },
            services: {
              type: "array",
              items: { type: "string" },
              description: "Services to integrate (slack, gmail, airtable, etc.)"
            },
            trigger: {
              type: "string",
              description: "Trigger type (webhook, cron, event)"
            },
            actions: {
              type: "array",
              items: { type: "string" },
              description: "Actions to perform (parse_data, filter, transform, etc.)"
            }
          },
          required: ["workflow_type", "services", "trigger", "actions"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "optimize_workflow",
        description: "Analyze n8n workflow and suggest optimizations for speed, reliability, and cost efficiency.",
        inputSchema: {
          type: "object",
          properties: {
            workflow: {
              type: "object",
              description: "Current workflow JSON"
            },
            focus_areas: {
              type: "array",
              items: {
                type: "string",
                enum: ["speed", "reliability", "cost"]
              },
              description: "Areas to focus optimization on"
            }
          },
          required: ["workflow"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "troubleshoot_workflow",
        description: "Diagnose n8n workflow failures and provide solutions. Analyzes error logs and execution data.",
        inputSchema: {
          type: "object",
          properties: {
            workflow: {
              type: "object",
              description: "Workflow configuration"
            },
            error_log: {
              type: "string",
              description: "Error messages from failed execution"
            },
            execution_data: {
              type: "object",
              description: "Last execution data (optional)"
            }
          },
          required: ["workflow", "error_log"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_error_workflow",
        description: "Create error handling and monitoring workflow with notifications and retry logic.",
        inputSchema: {
          type: "object",
          properties: {
            main_workflow_id: {
              type: "string",
              description: "ID of the main workflow to monitor"
            },
            notification_channels: {
              type: "array",
              items: { type: "string" },
              description: "Channels for alerts (slack, email)"
            },
            retry_strategy: {
              type: "string",
              enum: ["immediate", "exponential_backoff", "fixed_delay"],
              description: "Retry approach"
            }
          },
          required: ["main_workflow_id", "notification_channels", "retry_strategy"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "suggest_integrations",
        description: "Suggest n8n nodes and integrations based on use case description. Recommends workflow structure and alternative tools.",
        inputSchema: {
          type: "object",
          properties: {
            use_case: {
              type: "string",
              description: "Description of automation goal"
            },
            existing_tools: {
              type: "array",
              items: { type: "string" },
              description: "Tools/services already in use"
            }
          },
          required: ["use_case"]
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_data_transformation",
        description: "Create data transformation logic for n8n workflows. Maps source to target format with expressions.",
        inputSchema: {
          type: "object",
          properties: {
            input_format: {
              type: "object",
              description: "Source data structure"
            },
            output_format: {
              type: "object",
              description: "Target data structure"
            },
            transformations: {
              type: "array",
              items: { type: "string" },
              description: "Required transformations (concatenate, format_phone, etc.)"
            }
          },
          required: ["input_format", "output_format", "transformations"]
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
    ].map(t => ({ ...t, description: `${SERVER_COLOR_EMOJI} ${t.description}` })),
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
      case "generate_workflow": {
        const { workflow_type, services, trigger, actions } = GenerateWorkflowSchema.parse(args);

        const nodes = generateWorkflowNodes(services, actions, trigger);
        const connections = generateConnections(nodes);

        const workflow = {
          name: `${workflow_type} Workflow - ${services.join(", ")}`,
          nodes,
          connections,
          active: false,
          settings: {
            saveDataErrorExecution: "all",
            saveDataSuccessExecution: "all",
            saveManualExecutions: true
          }
        };

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              workflow,
              instructions: [
                "1. Import this workflow into n8n",
                "2. Configure credentials for each service",
                "3. Test with sample data",
                "4. Activate when ready"
              ]
            }, null, 2),
          }],
        };
        break;
      }

      case "optimize_workflow": {
        const { workflow, focus_areas } = OptimizeWorkflowSchema.parse(args);
        const typedWorkflow = workflow as N8nWorkflow;

        const analysis = analyzeWorkflow(typedWorkflow);
        const optimizations = generateOptimizations(typedWorkflow, focus_areas || ["speed", "reliability"]);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              current_analysis: analysis,
              optimizations,
              projected_improvements: optimizations.length > 0 ?
                "Applying all optimizations could improve performance by 40-60%" :
                "Workflow appears well-optimized"
            }, null, 2),
          }],
        };
        break;
      }

      case "troubleshoot_workflow": {
        const { workflow, error_log, execution_data } = TroubleshootWorkflowSchema.parse(args);
        const typedWorkflow = workflow as N8nWorkflow;

        const diagnosis = diagnoseWorkflowError(error_log, typedWorkflow);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              workflow_name: typedWorkflow.name || "Unknown",
              diagnosis,
              execution_context: execution_data ? {
                last_successful_node: execution_data.lastNodeExecuted,
                items_processed: execution_data.itemsCount
              } : undefined
            }, null, 2),
          }],
        };
        break;
      }

      case "generate_error_workflow": {
        const { main_workflow_id, notification_channels, retry_strategy } = GenerateErrorWorkflowSchema.parse(args);

        const errorWorkflow = generateErrorWorkflow(main_workflow_id, notification_channels, retry_strategy);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              error_workflow: errorWorkflow,
              setup_instructions: [
                "1. Import this workflow into n8n",
                "2. Configure notification credentials",
                `3. Set this as error workflow for ${main_workflow_id}`,
                "4. Test by triggering an error in main workflow"
              ]
            }, null, 2),
          }],
        };
        break;
      }

      case "suggest_integrations": {
        const { use_case, existing_tools } = SuggestIntegrationsSchema.parse(args);

        const suggestions = suggestIntegrations(use_case, existing_tools || []);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              use_case,
              existing_tools: existing_tools || [],
              ...suggestions
            }, null, 2),
          }],
        };
        break;
      }

      case "generate_data_transformation": {
        const { input_format, output_format, transformations } = GenerateDataTransformationSchema.parse(args);

        const transformation = generateDataTransformation(input_format, output_format, transformations);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify(transformation, null, 2),
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

}); // runServer
