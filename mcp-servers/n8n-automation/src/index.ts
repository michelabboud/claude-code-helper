#!/usr/bin/env node

/**
 * n8n Automation MCP Server
 * Provides n8n workflow generation, optimization, and troubleshooting tools
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Tool input schemas
const GenerateWorkflowSchema = z.object({
  workflow_type: z.enum(["scheduled", "webhook", "event-driven"]).describe("Workflow trigger type"),
  services: z.array(z.string()).describe("Services to integrate"),
  trigger: z.string().describe("Trigger configuration"),
  actions: z.array(z.string()).describe("Actions to perform"),
});

const OptimizeWorkflowSchema = z.object({
  workflow: z.any().describe("Current workflow JSON"),
  focus_areas: z.array(z.enum(["speed", "reliability", "cost"])).optional().describe("Optimization focus"),
});

const TroubleshootWorkflowSchema = z.object({
  workflow: z.any().describe("Workflow configuration"),
  error_log: z.string().describe("Error messages"),
  execution_data: z.any().optional().describe("Last execution data"),
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
  input_format: z.any().describe("Source data structure"),
  output_format: z.any().describe("Target data structure"),
  transformations: z.array(z.string()).describe("Required transformations"),
});

// MCP Server
const server = new Server(
  {
    name: "n8n-automation-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// n8n node templates
const nodeTemplates: Record<string, any> = {
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
function generateWorkflowNodes(services: string[], actions: string[], trigger: string): any[] {
  const nodes: any[] = [];
  let position = [250, 300];

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

function generateConnections(nodes: any[]): Record<string, any> {
  const connections: Record<string, any> = {};

  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];

    connections[currentNode.name] = {
      main: [[{ node: nextNode.name, type: "main", index: 0 }]]
    };
  }

  return connections;
}

function analyzeWorkflow(workflow: any): any {
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || {};

  const analysis = {
    total_nodes: nodes.length,
    node_types: nodes.map((n: any) => n.type),
    has_error_handling: nodes.some((n: any) => n.name?.toLowerCase().includes("error")),
    has_retry_logic: nodes.some((n: any) =>
      n.parameters?.retryOnFail || n.name?.toLowerCase().includes("retry")
    ),
    estimated_execution_time: `${nodes.length * 0.5}s average`,
    complexity: nodes.length > 10 ? "high" : nodes.length > 5 ? "medium" : "low"
  };

  return analysis;
}

function generateOptimizations(workflow: any, focusAreas: string[]): any[] {
  const optimizations: any[] = [];
  const nodes = workflow.nodes || [];

  // Speed optimizations
  if (focusAreas.includes("speed")) {
    // Check for sequential API calls that could be parallel
    const httpNodes = nodes.filter((n: any) => n.type?.includes("httpRequest"));
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
    const hasErrorHandler = nodes.some((n: any) =>
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

function diagnoseWorkflowError(errorLog: string, workflow: any): any {
  const logLower = errorLog.toLowerCase();
  const diagnosis: any = {
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

function generateErrorWorkflow(mainWorkflowId: string, channels: string[], retryStrategy: string): any {
  const nodes: any[] = [];
  let position = [250, 300];

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
  const retryConfig: Record<string, any> = {
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

function suggestIntegrations(useCase: string, existingTools: string[]): any {
  const useCaseLower = useCase.toLowerCase();
  const suggestions: any = {
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

function generateDataTransformation(inputFormat: any, outputFormat: any, transformations: string[]): any {
  const mappings: any[] = [];
  const expressions: any[] = [];

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
        if (typeof inputFormat[inKey] === "object" && inputFormat[inKey] !== null) {
          for (const nestedKey of Object.keys(inputFormat[inKey])) {
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
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

        return {
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
      }

      case "optimize_workflow": {
        const { workflow, focus_areas } = OptimizeWorkflowSchema.parse(args);

        const analysis = analyzeWorkflow(workflow);
        const optimizations = generateOptimizations(workflow, focus_areas || ["speed", "reliability"]);

        return {
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
      }

      case "troubleshoot_workflow": {
        const { workflow, error_log, execution_data } = TroubleshootWorkflowSchema.parse(args);

        const diagnosis = diagnoseWorkflowError(error_log, workflow);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              workflow_name: workflow.name || "Unknown",
              diagnosis,
              execution_context: execution_data ? {
                last_successful_node: execution_data.lastNodeExecuted,
                items_processed: execution_data.itemsCount
              } : undefined
            }, null, 2),
          }],
        };
      }

      case "generate_error_workflow": {
        const { main_workflow_id, notification_channels, retry_strategy } = GenerateErrorWorkflowSchema.parse(args);

        const errorWorkflow = generateErrorWorkflow(main_workflow_id, notification_channels, retry_strategy);

        return {
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
      }

      case "suggest_integrations": {
        const { use_case, existing_tools } = SuggestIntegrationsSchema.parse(args);

        const suggestions = suggestIntegrations(use_case, existing_tools || []);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              use_case,
              existing_tools: existing_tools || [],
              ...suggestions
            }, null, 2),
          }],
        };
      }

      case "generate_data_transformation": {
        const { input_format, output_format, transformations } = GenerateDataTransformationSchema.parse(args);

        const transformation = generateDataTransformation(input_format, output_format, transformations);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(transformation, null, 2),
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("n8n Automation MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
