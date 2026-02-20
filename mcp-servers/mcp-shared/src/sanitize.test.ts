import { sanitizePath, sanitizeUrl, sanitizeString, SanitizationError } from "./sanitize.js";
import path from "node:path";

describe("sanitizePath", () => {
  it("should resolve a relative path", () => {
    const result = sanitizePath("./src/index.ts");
    expect(path.isAbsolute(result)).toBe(true);
  });

  it("should reject empty paths", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
    expect(() => sanitizePath("  ")).toThrow(SanitizationError);
  });

  it("should reject null bytes", () => {
    expect(() => sanitizePath("/tmp/file\0.txt")).toThrow("null bytes");
  });

  it("should block path traversal when basePath is set", () => {
    expect(() => sanitizePath("../../etc/passwd", "/home/user/project")).toThrow(
      "resolves outside"
    );
  });

  it("should allow paths within basePath", () => {
    const base = "/home/user/project";
    const result = sanitizePath("/home/user/project/src/file.ts", base);
    expect(result).toBe("/home/user/project/src/file.ts");
  });

  it("should allow the basePath itself", () => {
    const base = "/home/user/project";
    const result = sanitizePath(base, base);
    expect(result).toBe(base);
  });

  it("should trim whitespace from paths", () => {
    const result = sanitizePath("  /tmp/file.ts  ");
    expect(result).toBe("/tmp/file.ts");
  });
});

describe("sanitizeUrl", () => {
  it("should accept valid http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("should accept valid https URLs", () => {
    expect(sanitizeUrl("https://api.example.com/v1")).toBe("https://api.example.com/v1");
  });

  it("should reject empty URLs", () => {
    expect(() => sanitizeUrl("")).toThrow(SanitizationError);
  });

  it("should reject invalid URLs", () => {
    expect(() => sanitizeUrl("not-a-url")).toThrow("Invalid URL");
  });

  it("should reject non-http protocols", () => {
    expect(() => sanitizeUrl("ftp://example.com")).toThrow("Disallowed protocol");
    expect(() => sanitizeUrl("file:///etc/passwd")).toThrow("Disallowed protocol");
    expect(() => sanitizeUrl("javascript:alert(1)")).toThrow("Disallowed protocol");
  });

  it("should block localhost", () => {
    expect(() => sanitizeUrl("http://localhost:8080")).toThrow("Blocked internal");
  });

  it("should block private IPs", () => {
    expect(() => sanitizeUrl("http://127.0.0.1")).toThrow("Blocked internal");
    expect(() => sanitizeUrl("http://10.0.0.1")).toThrow("Blocked internal");
    expect(() => sanitizeUrl("http://192.168.1.1")).toThrow("Blocked internal");
    expect(() => sanitizeUrl("http://172.16.0.1")).toThrow("Blocked internal");
  });

  it("should block link-local addresses", () => {
    expect(() => sanitizeUrl("http://169.254.169.254")).toThrow("Blocked internal");
  });
});

describe("sanitizeString", () => {
  it("should pass through normal strings", () => {
    expect(sanitizeString("hello world")).toBe("hello world");
  });

  it("should strip null bytes", () => {
    expect(sanitizeString("hello\0world")).toBe("helloworld");
  });

  it("should reject strings exceeding max length", () => {
    const long = "a".repeat(101);
    expect(() => sanitizeString(long, 100)).toThrow("exceeds maximum length");
  });

  it("should allow strings at exactly max length", () => {
    const exact = "a".repeat(100);
    expect(sanitizeString(exact, 100)).toBe(exact);
  });
});
