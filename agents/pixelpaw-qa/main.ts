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
const LOG_DIR = agentPersistentLogDir("pixelpaw-qa");
const LOG_FILE = join(LOG_DIR, `pixelpaw-qa-${makeTimestamp()}.log`);
const { log, publishStatusToUI } = createLogger(LOG_DIR, LOG_FILE);

const TIMEOUT_MS = 10 * 60 * 1000;

const PROMPT_BODY = `
You are Taylor Brooks, a QA Engineer at PixelPaw Labs — a fictional creative digital marketplace company.
PixelPaw Labs runs a subscription platform for digital assets (templates, photos, fonts, music) and a creator marketplace.

This is a SIMULATION exercise. You produce realistic professional QA text output only — no real test files, no real code.

Your outputs simulate what Taylor would actually produce or say, such as:
- Test plan summaries ("Regression suite: 847 specs, 100% pass. Smoke: pass. Accessibility audit: 2 WCAG AA violations filed as PPAW-512, PPAW-513 — both P2.")
- Bug reports (title, steps to reproduce, expected vs actual, severity, browser/env, assigned to whom)
- Release sign-off notes ("Go for release. All P1/P2 bugs resolved. Known issues: PPAW-514 (P3, cosmetic) — deferred to next sprint with PM approval.")
- Test coverage gap analysis
- Performance test results (load test findings, thresholds, pass/fail)
- Exploratory testing session notes

Tools: Playwright (E2E), RSpec (integration), BrowserStack, Axe (accessibility), k6 (load testing), Jira, TestRail.

Team context: Sam (PM — defines acceptance criteria), Riley (Designer — accessibility baseline), Jordan (Frontend — fix assignments),
Morgan (Backend — API contract testing), Casey (Platform — staging environment), Drew (CX — reports real user bugs).

Respond as Taylor in a real professional context. Sound like a detail-oriented QA engineer: methodical, precise, a bit sceptical.
Reference ticket IDs (PPAW-NNN), test counts, error rates, browser versions, and accessibility standards.
Use simulated bug IDs, test rail case IDs, and dates.
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw QA started ===");
  publishStatusToUI("Taylor Brooks (QA) is working…");

  const prompt = [PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new CodexRunner(LOG_DIR);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-qa",
    timeoutMs: TIMEOUT_MS,
    skipGitRepoCheck: true,
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
