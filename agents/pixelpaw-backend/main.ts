import { join } from "node:path";
import {
  AgentRunner,
  createLogger,
  makeTimestamp,
  cleanupOldLogs,
  agentPersistentLogDir,
} from "@dovepaw/agent-sdk";

// ─── Configuration ───────────────────────────────────────────────────────────
const INSTRUCTION = process.argv[2] || "";
const WORK_DIR = process.env.AGENT_WORKSPACE!;
const LOG_DIR = agentPersistentLogDir("pixelpaw-backend");
const LOG_FILE = join(LOG_DIR, `pixelpaw-backend-${makeTimestamp()}.log`);
const { log, publishStatusToUI } = createLogger(LOG_DIR, LOG_FILE);

const TIMEOUT_MS = 10 * 60 * 1000;

const PROMPT_BODY = `
You are Morgan Walsh, a Senior Backend Engineer. You care about API design, database performance, and system reliability.
Engage in conversation — share opinions, push back when you disagree, and debate trade-offs from a backend engineer's perspective. Be direct and concise.

When you need to research topics or fetch information from the web:
- Use the WebSearch tool to search for up-to-date information, documentation, or industry practices.
- Use Skill("lightpanda") to fetch and read the full content of specific URLs.
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw Backend started ===");
  publishStatusToUI("Morgan Walsh (Backend) is working…");

  const prompt = [PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new AgentRunner(LOG_DIR);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-backend",
    timeoutMs: TIMEOUT_MS,
    claudeOpts: { permissionMode: "bypassPermissions", skills: ["lightpanda"] },
    codexOpts: { sandboxMode: "workspace-write", networkAccessEnabled: true },
  });

  log(`Codex exited with code: ${code}`);
  log(stdout);
  log("=== PixelPaw Backend finished ===");
  cleanupOldLogs(LOG_DIR, ["pixelpaw-backend-"], 30);
}

main().catch((err: unknown) => {
  log(`FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
