# n8n Automation MCP Server

A Model Context Protocol (MCP) server for n8n workflow automation, enabling Claude to create, manage, optimize, and troubleshoot n8n workflows and integrations.

## Overview

This MCP server enables Claude to design and manage n8n workflows with best practices for automation, data transformation, error handling, and integration patterns.

## Features

- **Workflow Generation**: Create n8n workflows for various automation scenarios
- **Node Configuration**: Configure n8n nodes with proper credentials and settings
- **Error Handling**: Implement retry logic, error workflows, and monitoring
- **Data Transformation**: Design data mapping and transformation logic
- **Integration Patterns**: Connect multiple services with best practices
- **Workflow Optimization**: Improve performance and reliability

## Installation

```bash
npm install @modelcontextprotocol/sdk
npm install n8n
```

## Tools Provided

### 1. `generate_workflow`

Generate n8n workflow configuration for automation scenarios.

**Parameters**:
- `workflow_type` (string): Type (scheduled, webhook, event-driven)
- `services` (array): Services to integrate (gmail, slack, airtable, etc.)
- `trigger` (string): Workflow trigger type
- `actions` (array): Actions to perform

**Example**:
```javascript
await mcp.call('generate_workflow', {
  workflow_type: 'webhook',
  services: ['slack', 'airtable', 'gmail'],
  trigger: 'webhook',
  actions: ['parse_data', 'create_record', 'send_notification']
})
```

**Returns**:
```json
{
  "name": "Webhook to Airtable and Slack",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "data-intake",
        "responseMode": "onReceived",
        "options": {}
      }
    },
    {
      "name": "Parse JSON",
      "type": "n8n-nodes-base.set",
      "position": [450, 300],
      "parameters": {
        "values": {
          "string": [
            {
              "name": "name",
              "value": "={{$json[\"body\"][\"name\"]}}"
            },
            {
              "name": "email",
              "value": "={{$json[\"body\"][\"email\"]}}"
            }
          ]
        }
      }
    },
    {
      "name": "Airtable",
      "type": "n8n-nodes-base.airtable",
      "position": [650, 250],
      "parameters": {
        "operation": "append",
        "application": "={{$credentials.airtableBase}}",
        "table": "Contacts",
        "options": {}
      },
      "credentials": {
        "airtableApi": "airtable_credentials"
      }
    },
    {
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "position": [650, 350],
      "parameters": {
        "channel": "#notifications",
        "text": "New contact: {{$json[\"name\"]}} ({{$json[\"email\"]}})"
      },
      "credentials": {
        "slackApi": "slack_credentials"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Parse JSON", "type": "main", "index": 0}]]
    },
    "Parse JSON": {
      "main": [
        [
          {"node": "Airtable", "type": "main", "index": 0},
          {"node": "Slack", "type": "main", "index": 0}
        ]
      ]
    }
  }
}
```

### 2. `optimize_workflow`

Analyze and optimize existing n8n workflow for performance and reliability.

**Parameters**:
- `workflow` (object): Current workflow JSON
- `focus_areas` (array): Areas to optimize (speed, reliability, cost)

**Example**:
```javascript
await mcp.call('optimize_workflow', {
  workflow: currentWorkflow,
  focus_areas: ['speed', 'reliability']
})
```

**Returns**:
```json
{
  "current_analysis": {
    "total_nodes": 8,
    "execution_time_avg": "5.2s",
    "error_rate": "2.3%",
    "api_calls_per_run": 12
  },
  "optimizations": [
    {
      "type": "batching",
      "impact": "high",
      "description": "Batch API calls to reduce execution time",
      "implementation": "Use batch node to group 10 items per API call",
      "expected_improvement": "40% faster, 80% fewer API calls"
    },
    {
      "type": "error_handling",
      "impact": "high",
      "description": "Add retry logic and error workflows",
      "implementation": "Add 'If' node to check for errors and retry with exponential backoff"
    },
    {
      "type": "caching",
      "impact": "medium",
      "description": "Cache frequently accessed data",
      "implementation": "Use Redis node to cache lookup data for 1 hour"
    }
  ],
  "projected_metrics": {
    "execution_time_avg": "3.1s",
    "error_rate": "0.5%",
    "api_calls_per_run": 3,
    "improvement": "40% faster, 78% fewer errors"
  }
}
```

### 3. `troubleshoot_workflow`

Diagnose issues in n8n workflows and suggest fixes.

**Parameters**:
- `workflow` (object): Workflow configuration
- `error_log` (string): Error messages or execution log
- `execution_data` (object): Last execution data

**Example**:
```javascript
await mcp.call('troubleshoot_workflow', {
  workflow: myWorkflow,
  error_log: "Error: Connection timeout at Airtable node",
  execution_data: lastExecution
})
```

**Returns**:
```json
{
  "diagnosis": {
    "error_type": "timeout",
    "affected_node": "Airtable",
    "root_cause": "Large dataset causing timeout on Airtable API"
  },
  "solutions": [
    {
      "priority": "high",
      "fix": "Implement pagination for large datasets",
      "implementation": {
        "add_nodes": ["Loop Over Items", "Split In Batches"],
        "configuration": {
          "batch_size": 100,
          "delay_between_batches": 1000
        }
      }
    },
    {
      "priority": "medium",
      "fix": "Increase timeout setting",
      "implementation": {
        "node": "Airtable",
        "setting": "timeout",
        "value": 30000
      }
    }
  ]
}
```

### 4. `generate_error_workflow`

Create error handling and monitoring workflow.

**Parameters**:
- `main_workflow_id` (string): ID of main workflow to monitor
- `notification_channels` (array): Where to send alerts (slack, email)
- `retry_strategy` (string): How to handle retries

**Example**:
```javascript
await mcp.call('generate_error_workflow', {
  main_workflow_id: "workflow_123",
  notification_channels: ['slack', 'email'],
  retry_strategy: 'exponential_backoff'
})
```

### 5. `suggest_integrations`

Suggest n8n nodes and integrations for a use case.

**Parameters**:
- `use_case` (string): Description of automation goal
- `existing_tools` (array): Tools/services already in use

**Example**:
```javascript
await mcp.call('suggest_integrations', {
  use_case: "Automate customer support ticket creation from emails",
  existing_tools: ['gmail', 'zendesk']
})
```

**Returns**:
```json
{
  "recommended_workflow": {
    "trigger": "Gmail Trigger - Watch for new emails in support@company.com",
    "nodes": [
      {
        "name": "Gmail Trigger",
        "purpose": "Watch for new emails in support inbox"
      },
      {
        "name": "IF Node",
        "purpose": "Filter spam and auto-responses"
      },
      {
        "name": "OpenAI",
        "purpose": "Analyze email sentiment and urgency"
      },
      {
        "name": "Zendesk",
        "purpose": "Create ticket with priority based on analysis"
      },
      {
        "name": "Slack",
        "purpose": "Notify team of high-priority tickets"
      }
    ]
  },
  "alternative_tools": [
    {
      "tool": "Freshdesk",
      "reason": "Alternative to Zendesk with simpler API"
    },
    {
      "tool": "Discord",
      "reason": "Alternative to Slack for notifications"
    }
  ]
}
```

### 6. `generate_data_transformation`

Create data transformation logic for n8n workflows.

**Parameters**:
- `input_format` (object): Source data structure
- `output_format` (object): Target data structure
- `transformations` (array): Required transformations

**Example**:
```javascript
await mcp.call('generate_data_transformation', {
  input_format: {
    "firstName": "John",
    "lastName": "Doe",
    "contact": {
      "email": "john@example.com",
      "phone": "555-1234"
    }
  },
  output_format: {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234"
  },
  transformations: ['concatenate_name', 'format_phone']
})
```

## Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "n8n-automation": {
      "command": "node",
      "args": ["/path/to/n8n-automation/dist/index.js"],
      "env": {
        "N8N_HOST": "http://localhost:5678",
        "N8N_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Usage Patterns

### Complete Automation Setup

```javascript
// 1. Generate workflow
const workflow = await mcp.call('generate_workflow', {
  workflow_type: 'scheduled',
  services: ['googlesheets', 'airtable', 'slack'],
  trigger: 'cron',
  actions': ['read_data', 'transform', 'sync', 'notify']
})

// 2. Add error handling
const errorWorkflow = await mcp.call('generate_error_workflow', {
  main_workflow_id: workflow.id,
  notification_channels: ['slack'],
  retry_strategy: 'exponential_backoff'
})

// 3. Optimize
const optimizations = await mcp.call('optimize_workflow', {
  workflow: workflow,
  focus_areas: ['speed', 'reliability']
})
```

## Best Practices

### Workflow Design
- Keep workflows simple and focused
- Use sub-workflows for reusable logic
- Implement proper error handling
- Add descriptive notes to nodes

### Performance
- Batch API calls when possible
- Use caching for frequently accessed data
- Implement rate limiting
- Monitor execution times

### Reliability
- Add retry logic with exponential backoff
- Implement circuit breakers
- Use error workflows
- Set appropriate timeouts

### Security
- Store credentials securely
- Use environment variables
- Implement authentication
- Validate input data

## Integration Examples

### Webhook to Database
```json
{
  "trigger": "Webhook",
  "steps": [
    "Validate Input",
    "Transform Data",
    "Write to Database",
    "Send Confirmation"
  ]
}
```

### Scheduled Data Sync
```json
{
  "trigger": "Cron (every hour)",
  "steps": [
    "Fetch from Source API",
    "Transform Data",
    "Batch Update Target",
    "Log Results"
  ]
}
```

### Event-Driven Processing
```json
{
  "trigger": "Queue Message",
  "steps": [
    "Parse Message",
    "Enrich Data",
    "Route Based on Type",
    "Process and Notify"
  ]
}
```

## Related Resources

- **Workflow Patterns**: `examples/skills/workflow-automation-patterns.md`
- **API Integration**: `examples/skills/api-integration-best-practices.md`
- **Error Handling**: `examples/skills/error-handling-patterns.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-10
**Platform**: n8n
**Status**: Production Ready ✅

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
