/**
 * Merk voice engine · the whole test suite in one command
 *
 *   npx tsx lib/merk/voice/eval/all.ts
 *   npm run merk:voice
 *
 * Runs the validator self-test, the model-reply handling test, the real-entry
 * integration test, and the 50-brief eval (validator gate) in sequence, and
 * exits non-zero if any of them fails. This is the acceptance command.
 */

import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));

const steps: Array<{ name: string; file: string; args?: string[] }> = [
  { name: "validator self-test", file: "validator.test.ts" },
  { name: "model-reply handling", file: "model-reply.test.ts" },
  { name: "real-producers boundary", file: "producers.test.ts" },
  { name: "no-stats degraded path", file: "no-stats.test.ts" },
  { name: "degenerate inputs", file: "degenerate.test.ts" },
  { name: "cache invalidation", file: "cache.test.ts" },
  { name: "real-entry integration", file: "integration.test.ts" },
  { name: "50-brief eval (en)", file: "run.ts" },
  { name: "50-brief eval (nb)", file: "run.ts", args: ["--nb"] },
];

let failed = 0;
for (const step of steps) {
  console.log(`\n\u2500\u2500\u2500 ${step.name} \u2500\u2500\u2500`);
  const res = spawnSync("npx", ["tsx", join(here, step.file), ...(step.args ?? [])], {
    stdio: "inherit",
  });
  if (res.status !== 0) {
    failed++;
    console.error(`\u2717 ${step.name} FAILED (exit ${res.status})`);
  }
}

console.log(`\n${"\u2550".repeat(72)}`);
if (failed) {
  console.error(`${failed} of ${steps.length} suites failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${steps.length} Merk voice suites passed.`);
}
