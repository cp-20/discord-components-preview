import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { deflateSync, strToU8 } from "fflate";
import { encodePayload, toBase64Url } from "../src/share";
import { presets } from "../src/presets";

/** The retired #p2= format: the same algorithm and encoder with the version 1 dictionary */
const v1 = readFileSync(new URL("./fixtures/p2-dictionary.txt", import.meta.url));
const p2 = (json: string) => toBase64Url(deflateSync(strToU8(json), { level: 9, dictionary: v1 })).length;
/** Payloads written separately from the dictionary, so the gain isn't measured only on text it was tuned for */
const heldOut: unknown[] = JSON.parse(readFileSync(new URL("./fixtures/heldout-payloads.json", import.meta.url), "utf8"));

const measure = (set: { id: string; payload: unknown }[]) =>
  set.map(({ id, payload }) => {
    const json = JSON.stringify(payload);
    return { id, json: json.length, p2: "#p2=".length + p2(json), p3: "#p3=".length + encodePayload(json).length };
  });

const report = (name: string, rows: ReturnType<typeof measure>) => {
  const sum = (k: "p2" | "p3") => rows.reduce((a, r) => a + r[k], 0);
  const line = (id: string, a: number, b: number) => `${id.padEnd(16)} ${String(a).padStart(5)} ${String(b).padStart(5)} ${(((b - a) / a) * 100).toFixed(1).padStart(6)}%`;
  process.stderr.write([`[${name}]  #p2=  #p3=`, ...rows.map((r) => line(r.id, r.p2, r.p3)), line("total", sum("p2"), sum("p3")), ""].join("\n"));
  return { p2: sum("p2"), p3: sum("p3") };
};

describe("link length", () => {
  it("is shorter than #p2= for the examples", () => {
    const rows = measure(presets);
    const t = report("examples", rows);
    for (const r of rows) expect(r.p3, r.id).toBeLessThanOrEqual(r.p2);
    expect(t.p3).toBeLessThan(t.p2 * 0.97);
  });
  it("is shorter than #p2= for payloads the dictionary wasn't written from", () => {
    const t = report("held-out", measure(heldOut.map((payload, i) => ({ id: `held-out ${i + 1}`, payload }))));
    expect(t.p3).toBeLessThan(t.p2 * 0.9);
  });
});
