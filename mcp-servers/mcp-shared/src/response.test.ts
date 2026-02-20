import { successResponse, jsonResponse, errorResponse } from "./response.js";

describe("successResponse", () => {
  it("should create a text response", () => {
    const result = successResponse("All good");
    expect(result).toEqual({
      content: [{ type: "text", text: "All good" }],
    });
    expect(result.isError).toBeUndefined();
  });
});

describe("jsonResponse", () => {
  it("should format data as pretty JSON with label", () => {
    const result = jsonResponse("Analysis results", { score: 95, issues: [] });
    expect(result.content[0].text).toContain("Analysis results:");
    expect(result.content[0].text).toContain('"score": 95');
  });
});

describe("errorResponse", () => {
  it("should create an error response from Error object", () => {
    const result = errorResponse(new Error("File not found"), "readFile");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error in readFile: File not found");
  });

  it("should create an error response from string", () => {
    const result = errorResponse("Something broke");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: Something broke");
  });

  it("should handle missing context", () => {
    const result = errorResponse(new Error("Oops"));
    expect(result.content[0].text).toBe("Error: Oops");
  });
});
