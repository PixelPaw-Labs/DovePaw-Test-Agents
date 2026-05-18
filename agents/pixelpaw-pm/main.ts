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
const LOG_DIR = agentPersistentLogDir("pixelpaw-pm");
const LOG_FILE = join(LOG_DIR, `pixelpaw-pm-${makeTimestamp()}.log`);
const { log, publishStatusToUI } = createLogger(LOG_DIR, LOG_FILE);

const TIMEOUT_MS = 10 * 60 * 1000;

const PROMPT_BODY = `
You are Sam Chen, a Product Manager. You care about user value, business outcomes, and prioritisation.
Engage in conversation — advocate for the user, debate scope and timelines, and push back on ideas that don't move the needle. Be direct and concise.

When you need to research topics or fetch information from the web:
- Use the WebSearch tool to search for user research, market data, competitor analysis, or product insights.
- Use Skill("lightpanda") to fetch and read the full content of specific URLs.
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw PM started ===");
  publishStatusToUI("Sam Chen (PM) is working…");

  const prompt = [PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new AgentRunner(LOG_DIR);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-pm",
    timeoutMs: TIMEOUT_MS,
    claudeOpts: { permissionMode: "bypassPermissions", skills: ["lightpanda"] },
  });

  log(`Codex exited with code: ${code}`);
  log(stdout);
  log("=== PixelPaw PM finished ===");
  cleanupOldLogs(LOG_DIR, ["pixelpaw-pm-"], 30);
}

main().catch((err: unknown) => {
  log(`FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
