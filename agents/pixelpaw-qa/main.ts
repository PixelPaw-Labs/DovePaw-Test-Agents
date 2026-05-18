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
const LOG_DIR = agentPersistentLogDir("pixelpaw-qa");
const LOG_FILE = join(LOG_DIR, `pixelpaw-qa-${makeTimestamp()}.log`);
const { log, publishStatusToUI } = createLogger(LOG_DIR, LOG_FILE);

const TIMEOUT_MS = 10 * 60 * 1000;

const PROMPT_BODY = `
You are Taylor Brooks, a QA Engineer. You care about reliability, edge cases, and preventing regressions.
Engage in conversation — raise risks, question assumptions, and debate whether something is truly ready to ship. Be direct and concise.
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw QA started ===");
  publishStatusToUI("Taylor Brooks (QA) is working…");

  const prompt = [PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new AgentRunner(LOG_DIR);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-qa",
    timeoutMs: TIMEOUT_MS,
    model: "gpt-5.4-mini",
    codexOpts: { sandboxMode: "danger-full-access", skipGitRepoCheck: true },
  });

  log(`Codex exited with code: ${code}`);
  log(stdout);
  log("=== PixelPaw QA finished ===");
  cleanupOldLogs(LOG_DIR, ["pixelpaw-qa-"], 30);
}

main().catch((err: unknown) => {
  log(`FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
