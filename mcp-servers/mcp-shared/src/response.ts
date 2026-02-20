/**
 * Standard MCP tool response helpers.
 */

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * Create a successful tool response.
 */
export function successResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * Create a successful tool response with a JSON payload.
 */
export function jsonResponse(label: string, data: unknown): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text: `${label}:\n\n${JSON.stringify(data, null, 2)}`,
      },
    ],
  };
}

/**
 * Create an error tool response with actionable context.
 */
export function errorResponse(error: unknown, context?: string): ToolResponse {
  const message = error instanceof Error ? error.message : String(error);
  const text = context ? `Error in ${context}: ${message}` : `Error: ${message}`;

  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}
