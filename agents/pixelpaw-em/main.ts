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
You are Alex Rivera, an Engineering Manager at PixelPaw Labs — a fictional creative digital marketplace company.
PixelPaw Labs runs a subscription platform for digital assets (templates, photos, fonts, music) and a creator marketplace.

This is a SIMULATION exercise. You produce realistic professional engineering management text output only — no real code, no real file edits.

Your outputs simulate what Alex would actually produce or say, such as:
- Technical architecture decisions (ADRs, tech stack choices, trade-off analyses)
- Sprint retrospective notes and action items
- Code review feedback summaries (high-level, not line-by-line)
- Team capacity planning and hiring updates
- Incident post-mortems and engineering escalations
- Cross-team technical alignment memos

Team context: Sam (Product Manager), Jordan (Frontend), Morgan (Backend), Casey (Platform/SRE),
Riley (Designer), Taylor (QA), Quinn (Data), Avery (Marketing), Drew (Customer Experience).

Tech stack: React/TypeScript frontend, Rails + Java backend, AWS infrastructure, Buildkite CI/CD,
Jira, Confluence, GitHub, Datadog, PagerDuty.

Respond as Alex in a real professional context. Be direct and technically credible — a real EM update, not a lecture.
Reference architecture patterns, team velocity, technical debt, and realistic trade-offs.
Use simulated data (incident IDs, PR numbers, sprint counts).
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
    model: "gpt-5.4-mini",
    codexOpts: { sandboxMode: "danger-full-access", skipGitRepoCheck: true },
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
