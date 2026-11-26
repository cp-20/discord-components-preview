import { describe, expect, it } from "vitest";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { decodePayload, encodePayload, minify, readFragment, shareUrl } from "../src/share";
import { DICTIONARY } from "../src/dictionary";
import { presets, presetJson } from "../src/presets";

const pretty = JSON.stringify({ flags: 32768, components: [{ type: 10, content: "上映時間 **13:15** <:check:921544057312915498>" }] }, null, 2);

describe("share links (#p2=)", () => {
  it("round-trips every preset through the URL", () => {
    for (const p of presets) {
      const text = presetJson(p);
      const url = shareUrl("https://discord.cp20.dev/gallery#p2=old", text);
      expect(url, p.id).toMatch(/^https:\/\/discord\.cp20\.dev\/gallery#p2=[A-Za-z0-9_-]+$/);
      expect(readFragment(new URL(url).hash), p.id).toBe(text);
    }
  });
  it("compresses minified JSON and pretty-prints it on the way back", () => {
    const enc = encodePayload(pretty);
    expect(enc).toBe(encodePayload(JSON.stringify(JSON.parse(pretty))));
    expect(decodePayload(enc)).toBe(pretty);
  });
  it("keeps text that isn't valid JSON as it is", () => {
    const broken = '{ "content": "half';
    expect(minify(broken)).toBe(broken);
    expect(decodePayload(encodePayload(broken))).toBe(broken);
  });
  it("matches the published algorithm: Node zlib raw deflate with the same dictionary", () => {
    const json = JSON.stringify(presets[0].payload);
    const dict = Buffer.from(DICTIONARY, "utf8");
    // What an agent would write by following /llms.txt
    const theirs = zlib.deflateRawSync(Buffer.from(json), { level: 9, dictionary: dict }).toString("base64url");
    expect(decodePayload(theirs)).toBe(JSON.stringify(presets[0].payload, null, 2));
    // And our output inflates with their tools
    const ours = Buffer.from(encodePayload(json), "base64url");
    expect(zlib.inflateRawSync(ours, { dictionary: dict }).toString()).toBe(json);
  });
  it("needs the dictionary to inflate", () => {
    const ours = Buffer.from(encodePayload(JSON.stringify(presets[0].payload)), "base64url");
    expect(() => zlib.inflateRawSync(ours)).toThrow();
  });
  it("ignores retired formats and garbage", () => {
    const legacy = zlib.deflateRawSync(Buffer.from(pretty)).toString("base64url");
    expect(readFragment("#p=" + legacy)).toBeNull();
    expect(readFragment("#p2=%%%")).toBeNull();
    expect(readFragment("#p2=" + encodeURIComponent(pretty))).toBeNull();
    expect(readFragment("#x=1")).toBeNull();
  });
  it("keeps the frozen dictionary byte-for-byte", () => {
    // Every #p2= link depends on these bytes. If this fails, revert the dictionary or move to #p3=.
    const bytes = Buffer.from(DICTIONARY, "utf8");
    expect({ length: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }).toMatchSnapshot();
  });
});
