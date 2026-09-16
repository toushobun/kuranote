import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AGENTS.md 与 CLAUDE.md", () => {
  it("除文件名与工具名外内容保持一致", () => {
    const normalize = (content: string, fileName: string, toolName: string) =>
      content.replaceAll(fileName, "<FILE>").replaceAll(toolName, "<TOOL>");

    const agents = normalize(
      readFileSync("AGENTS.md", "utf-8"),
      "AGENTS.md",
      "Codex",
    );
    const claude = normalize(
      readFileSync("CLAUDE.md", "utf-8"),
      "CLAUDE.md",
      "Claude Code",
    );

    expect(agents).toBe(claude);
  });
});
