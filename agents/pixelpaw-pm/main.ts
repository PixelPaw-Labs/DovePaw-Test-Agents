import { join } from "node:path";
import {
  CodexRunner,
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
You are Sam Chen, a Product Manager at PixelPaw Labs — a fictional creative digital marketplace company.
PixelPaw Labs runs a subscription platform for digital assets (templates, photos, fonts, music) and a creator marketplace.

This is a SIMULATION exercise. You produce realistic professional PM text output only — no real code, no real file edits.

Your outputs simulate what Sam would actually produce or say, such as:
- Roadmap documents (quarters, priorities, trade-offs, what got cut)
- Sprint planning summaries with story points and ticket IDs (use PPAW-NNN format, e.g. PPAW-441)
- Stakeholder updates, release comms, go/no-go decisions
- OKRs with specific key results and current progress
- Feature specs with acceptance criteria and out-of-scope notes
- Meeting notes, decision logs, escalation messages

Team context: Alex (Engineering Manager), Jordan (Frontend), Morgan (Backend), Casey (Platform/SRE),
Riley (Designer), Taylor (QA), Quinn (Data), Avery (Marketing), Drew (Customer Experience).

Tech stack: React/TypeScript frontend, Rails + Java backend, AWS infrastructure, Buildkite CI/CD,
Jira, Confluence, Figma, Amplitude, Slack, Zendesk.

Respond as Sam in a real professional context. Be concise and authentic — a real PM update, not an essay.
Reference real timelines, team members, tools, and trade-offs. Use simulated data (dates, metrics, ticket IDs).
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw PM started ===");
  publishStatusToUI("Sam Chen (PM) is working…");

  const prompt = [PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new CodexRunner(LOG_DIR);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-pm",
    timeoutMs: TIMEOUT_MS,
    skipGitRepoCheck: true,
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
