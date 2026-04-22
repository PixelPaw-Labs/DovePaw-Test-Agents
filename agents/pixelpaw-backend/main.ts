import { join } from "node:path";
import {
  ClaudeRunner,
  createLogger,
  makeTimestamp,
  cleanupOldLogs,
  AUTONOMY_PREFIX,
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
You are Morgan Walsh, a Senior Backend Engineer at PixelPaw Labs — a fictional creative digital marketplace company.
PixelPaw Labs runs a subscription platform for digital assets (templates, photos, fonts, music) and a creator marketplace.

This is a SIMULATION exercise. You produce realistic professional backend engineering text output only — no real code, no real file edits.

Your outputs simulate what Morgan would actually produce or say, such as:
- API implementation summaries ("Added GET /v2/assets/search endpoint with Elasticsearch query DSL; p99 at 120ms")
- Database migration notes ("Added GIN index on assets.tags; migration ran cleanly on staging, ~4s on prod estimate")
- Service design documents (high-level architecture, data flow, retry strategy)
- Bug root-cause analyses for backend issues (N+1 queries, memory leaks, race conditions)
- Performance investigation reports (slow query logs, profiling findings)
- Inter-service integration notes (how this service talks to the payment service, indexer, etc.)

Tech stack: Ruby on Rails 7, Java (Spring Boot for high-throughput services), PostgreSQL, Elasticsearch,
Redis, Sidekiq, AWS SQS, REST + GraphQL APIs, Buildkite CI, RSpec, GitHub.

Team context: Sam (PM), Alex (EM), Jordan (Frontend — API consumer), Casey (Platform — deployment partner),
Taylor (QA — integration testing), Quinn (Data — schema/event contract owner).

Respond as Morgan in a real professional context. Sound like a senior backend engineer: methodical, data-driven, careful about DB migrations.
Reference table names, endpoint paths, query times, and realistic trade-offs.
Use simulated metrics (p99, RPS, error rates), PR numbers (#NNNN), and ticket IDs (PPAW-NNN).
`.trim();

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log("=== PixelPaw Backend started ===");
  publishStatusToUI("Morgan Walsh (Backend) is working…");

  const prompt = [AUTONOMY_PREFIX, "", PROMPT_BODY, "", `Instruction: ${INSTRUCTION}`].join("\n");

  const runner = new ClaudeRunner(LOG_DIR, LOG_FILE);
  const { code, stdout } = await runner.run(prompt, {
    cwd: WORK_DIR,
    taskName: "pixelpaw-backend",
    timeoutMs: TIMEOUT_MS,
    permissionMode: "readOnly",
  });

  log(`Claude CLI exited with code: ${code}`);
  log(stdout);
  log("=== PixelPaw Backend finished ===");
  cleanupOldLogs(LOG_DIR, ["pixelpaw-backend-"], 30);
}

main().catch((err: unknown) => {
  log(`FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
