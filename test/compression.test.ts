import { describe, expect, it } from "vitest";
import { deflateSync, strToU8 } from "fflate";
import { encodePayload, toBase64Url } from "../src/share";
import { presets, presetJson } from "../src/presets";

/** The retired #p= scheme: deflate-raw of the editor text as typed (pretty-printed), no dictionary */
const legacy = (text: string) => toBase64Url(deflateSync(strToU8(text), { level: 9 }));

describe("link length", () => {
  it("is shorter than the retired #p= links for every preset", () => {
    const rows = presets.map((p) => {
      const text = presetJson(p);
      const old = "#p=".length + legacy(text).length;
      const oldMin = "#p=".length + legacy(JSON.stringify(p.payload)).length;
      const now = "#p2=".length + encodePayload(text).length;
      expect(now, p.id).toBeLessThan(old);
      return { id: p.id, old, oldMinified: oldMin, p2: now, saved: `${Math.round((1 - now / old) * 100)}%` };
    });
    process.stderr.write(JSON.stringify(rows) + "\n");
  });
});
