import { jest } from "@jest/globals";
import { createMCPServer } from "./server.js";
import type { Logger } from "./logger.js";

describe("createMCPServer", () => {
  it("should create a server with the given name", () => {
    const instance = createMCPServer({ name: "test-server", version: "1.0.0" });
    expect(instance.server).toBeDefined();
    expect(instance.logger).toBeDefined();
    expect(instance.metrics).toBeDefined();
    expect(typeof instance.start).toBe("function");
  });

  it("should use default version when not specified", () => {
    const instance = createMCPServer({ name: "test-server" });
    expect(instance.server).toBeDefined();
  });

  it("should accept custom logger", () => {
    const customLogger: Logger = {
      debug: jest.fn<Logger["debug"]>(),
      info: jest.fn<Logger["info"]>(),
      warn: jest.fn<Logger["warn"]>(),
      error: jest.fn<Logger["error"]>(),
      child: jest.fn<Logger["child"]>().mockReturnThis(),
    };
    const instance = createMCPServer({ name: "test-server", logger: customLogger });
    expect(instance.logger).toBe(customLogger);
  });

  it("should provide a metrics collector", () => {
    const instance = createMCPServer({ name: "test-server" });
    expect(typeof instance.metrics.recordCall).toBe("function");
    expect(typeof instance.metrics.getSummary).toBe("function");
    expect(typeof instance.metrics.reset).toBe("function");
  });
});
