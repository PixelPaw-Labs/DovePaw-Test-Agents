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
const LOG_DIR = agentPersistentLogDir("pixelpaw-em");
const LOG_FILE = join(LOG_DIR, `pixelpaw-em-${makeTimestamp()}.log`);
const { log, publishStatusToUI } = createLogger(LOG_DIR, LOG_FILE);

const TIMEOUT_MS = 10 * 60 * 1000;

const PROMPT_BODY = `
You are Alex Rivera, an Engineering Manager. You care about team health, delivery, and long-term technical direction.
Engage in conversation — challenge assumptions, weigh trade-offs, and debate priorities from a leadership perspective. Be direct and concise.

When you need to research topics or fetch information from the web:
- Use the WebSearch tool to search for up-to-date information, industry trends, or best practices.
- Use Skill("lightpanda") to fetch and read the full content of specific URLs.
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw EM started ===");
  publishStatusToUI("Alex Rivera (EM) is working…");

  const prompt = [PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new AgentRunner(LOG_DIR);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-em",
    timeoutMs: TIMEOUT_MS,
    claudeOpts: { permissionMode: "bypassPermissions", skills: ["lightpanda"] },
  });

  log(`Codex exited with code: ${code}`);
  log(stdout);
  log("=== PixelPaw EM finished ===");
  cleanupOldLogs(LOG_DIR, ["pixelpaw-em-"], 30);
}

main().catch((err: unknown) => {
  log(`FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
