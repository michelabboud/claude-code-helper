import { checkCommand, commandHealthCheck } from "./check-command.js";

describe("checkCommand", () => {
  it("should return true for a command that exists (node)", async () => {
    const result = await checkCommand("node");
    expect(result).toBe(true);
  });

  it("should return false for a command that does not exist", async () => {
    const result = await checkCommand("definitely-not-a-real-command-xyz-123");
    expect(result).toBe(false);
  });
});

describe("commandHealthCheck", () => {
  it("should create a health check with cli- prefix name", () => {
    const hc = commandHealthCheck("eslint");
    expect(hc.name).toBe("cli-eslint");
    expect(typeof hc.check).toBe("function");
  });

  it("should return true when command exists", async () => {
    const hc = commandHealthCheck("node");
    const result = await hc.check();
    expect(result).toBe(true);
  });

  it("should return false when command does not exist", async () => {
    const hc = commandHealthCheck("definitely-not-a-real-command-xyz-123");
    const result = await hc.check();
    expect(result).toBe(false);
  });
});
