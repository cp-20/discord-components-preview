import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { presets } from "../src/presets";
import { buildLlmsTxt } from "../src/llms";
import { DICTIONARY } from "../src/dictionary";

// Examples must be made up. Personal handles, real titles and real venues once slipped into the
// gallery; this keeps them out of every place examples are published from.
const banned = [/cp-?20/i, /タコピー/, /ヒューマントラスト/, /シネマシティ/, /チネチッタ/, /109シネマズ/, /ttcg\.jp|cinemacity\.co\.jp|cinecitta\.co\.jp/];
// The site's own address and repository are not example data
const scrub = (s: string) => s.replace(/https:\/\/discord\.cp20\.dev/g, "SITE").replace(/github\.com\/cp-20\/discord-components-preview/g, "REPO");

const sources: [string, string][] = [
  ...presets.map((p) => [`preset ${p.id}`, JSON.stringify(p.payload)] as [string, string]),
  ["scripts/shot-cases.json", readFileSync(new URL("../scripts/shot-cases.json", import.meta.url), "utf8")],
  ["test/fixtures/heldout-payloads.json", readFileSync(new URL("./fixtures/heldout-payloads.json", import.meta.url), "utf8")],
  ["dictionary", DICTIONARY],
  ["/llms.txt", buildLlmsTxt(createHash("sha256").update(DICTIONARY).digest("hex"))],
];

describe("examples stay generic", () => {
  for (const [name, text] of sources) {
    it(name, () => {
      const t = scrub(text);
      for (const re of banned) expect(t, `${name} matches ${re}`).not.toMatch(re);
    });
  }
});
