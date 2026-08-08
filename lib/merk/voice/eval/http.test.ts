/**
 * Merk voice engine · HTTP call-site + control-flow test
 *
 * Exercises the real generateMerkCopy code path (the part the no-key fallback
 * test skips) by stubbing globalThis.fetch and setting a dummy API key. Asserts
 * the request shape sent to the model and the retry-then-fallback control flow.
 * No network, no real key. Run:
 *
 *   npx tsx lib/merk/voice/eval/http.test.ts
 */

import type { ProductBrief } from "@/lib/merk/voice/brief";
import { generateMerkCopy } from "@/lib/merk/voice/generate";
import { validate } from "@/lib/merk/voice/validate";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + detail + ")" : ""}`);
}

const brief: ProductBrief = {
  name: "Cheddar Burger Cheese",
  brand: "Tine",
  category: "cheese-yellow",
  categoryN: 214,
  score: 22,
  shelfMedian: 50,
  percentile: 12,
  drivers: [
    { nutrient: "salt", value: 2.1, unit: "g", vsCategory: "highest", direction: "penalty" },
    { nutrient: "protein", value: 18, unit: "g", vsCategory: "typical", direction: "credit" },
  ],
  additives: { total: 4, watch: [{ code: "E250", name: "Sodium nitrite", job: "preservative" }], safeCount: 2 },
  processing: { nova: 4, label: "Ultra-processed food" },
  allergens: ["milk"],
};

// A helper to build an OpenAI Responses-style body carrying a JSON string.
const okReply = (obj: unknown): Response =>
  new Response(JSON.stringify({ output_text: JSON.stringify(obj) }), { status: 200 });

const validCopy = {
  headline: "Saltiest on this shelf",
  verdict: "2,1 g salt per 100 g, the most on this shelf. The 18 g protein is the bright spot.",
  additiveNote: "Two additives do the same job, stretching shelf life.",
  wouldMerkBuy: "I'd buy it for a burger night, not the fridge shelf. At 2,1 g salt it tops this shelf.",
};
const hallucinated = { ...validCopy, verdict: "3,4 g salt per 100 g, the most on this shelf." };

const realFetch = globalThis.fetch;
type Handler = (url: string, init: RequestInit, callIndex: number) => Response | Promise<Response>;
let calls: Array<{ url: string; init: RequestInit }> = [];
function installFetch(handler: Handler) {
  calls = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === "string" ? url : url.toString();
    const idx = calls.length;
    calls.push({ url: u, init: init ?? {} });
    return handler(u, init ?? {}, idx);
  }) as typeof fetch;
}

async function main() {
  process.env.OPENAI_API_KEY = "test-key-not-real";
  process.env.MERK_VOICE_MODEL = "gpt-test-mini";

  try {
    // ── 1 · Happy path: one call, valid reply accepted, request shape correct.
    installFetch(() => okReply(validCopy));
    let res = await generateMerkCopy(brief, "en");
    check("happy path: source=model", res.source === "model", res.source);
    check("happy path: output validates", validate(res.copy, brief).ok);
    check("happy path: exactly one HTTP call", calls.length === 1, String(calls.length));

    const body = JSON.parse((calls[0].init.body as string) || "{}");
    check("request URL is the Responses endpoint", calls[0].url === "https://api.openai.com/v1/responses");
    check("request carries Authorization header", /Bearer test-key/.test(((calls[0].init.headers as Record<string, string>) || {})["Authorization"] || ""));
    check("request uses the configured model", body.model === "gpt-test-mini", body.model);
    check("request temperature is 0.4 on first try", body.temperature === 0.4, String(body.temperature));
    check("request caps output tokens at 400", body.max_output_tokens === 400, String(body.max_output_tokens));
    check("request uses strict json_schema named merk_copy", body.text?.format?.type === "json_schema" && body.text?.format?.name === "merk_copy" && body.text?.format?.strict === true);
    // system + 3 few-shot pairs (6) + 1 user = 8 input messages.
    check("request includes system + 3 few-shot pairs + user (8 msgs)", Array.isArray(body.input) && body.input.length === 8, String(body.input?.length));
    check("first input message is the system prompt", body.input?.[0]?.role === "system" && /You are Merk/.test(body.input?.[0]?.content));
    const lastMsg = JSON.parse(body.input?.[body.input.length - 1]?.content || "{}");
    check("final user message carries the brief and the limits", lastMsg.brief?.name === "Cheddar Burger Cheese" && lastMsg.limits?.headline === 42);

    // ── 2 · Retry: first reply hallucinates, retry at 0.2 returns valid.
    installFetch((_u, _i, idx) => (idx === 0 ? okReply(hallucinated) : okReply(validCopy)));
    res = await generateMerkCopy(brief, "en");
    check("retry: two HTTP calls made", calls.length === 2, String(calls.length));
    check("retry: second call temperature is 0.2", JSON.parse((calls[1].init.body as string) || "{}").temperature === 0.2);
    check("retry: recovered to source=model", res.source === "model", res.source);
    check("retry: output validates", validate(res.copy, brief).ok);

    // ── 3 · Both attempts fail validation -> template fallback.
    installFetch(() => okReply(hallucinated));
    res = await generateMerkCopy(brief, "en");
    check("double-fail: two HTTP calls", calls.length === 2, String(calls.length));
    check("double-fail: falls back to template", res.source === "template", res.source);
    check("double-fail: reports the failure reason", res.failure === "hallucinated-number", res.failure);
    check("double-fail: template still validates", validate(res.copy, brief).ok);

    // ── 4 · Non-ok HTTP -> template fallback, no throw.
    installFetch(() => new Response("upstream boom", { status: 500 }));
    res = await generateMerkCopy(brief, "en");
    check("http-500: falls back to template", res.source === "template", res.source);
    check("http-500: template validates", validate(res.copy, brief).ok);

    // ── 5 · fetch throws (network down) -> template fallback, no throw.
    installFetch(() => { throw new Error("ECONNRESET"); });
    res = await generateMerkCopy(brief, "en");
    check("network-error: falls back to template", res.source === "template", res.source);
    check("network-error: template validates", validate(res.copy, brief).ok);

    // ── 6 · Malformed (non-JSON) body -> template fallback.
    installFetch(() => new Response(JSON.stringify({ output_text: "sorry, no." }), { status: 200 }));
    res = await generateMerkCopy(brief, "en");
    check("bad-body: falls back to template", res.source === "template", res.source);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.OPENAI_API_KEY;
    delete process.env.MERK_VOICE_MODEL;
  }

  console.log(`\n${failures ? failures + " FAILURES" : "All HTTP call-site checks passed."}`);
  if (failures) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
