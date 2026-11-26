import { describe, expect, it } from "vitest";
import { decodePayload, encodePayload, readFragment, shareUrl, toBase64Url } from "../src/share";
import { zlibSync, strToU8 } from "fflate";

const json = JSON.stringify({ flags: 32768, components: [{ type: 10, content: "上映時間 **13:15**" }] });

describe("share", () => {
  it("round-trips deflate-raw + base64url", () => {
    const enc = encodePayload(json);
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePayload(enc)).toBe(json);
  });
  it("reads the fragment of a share url", () => {
    const url = shareUrl("https://discord.cp20.dev/#p=old", json);
    expect(url.startsWith("https://discord.cp20.dev/#p=")).toBe(true);
    expect(readFragment(new URL(url).hash)).toBe(json);
  });
  it("accepts uncompressed base64url and base64 with padding", () => {
    const b64url = toBase64Url(strToU8(json));
    expect(decodePayload(b64url)).toBe(json);
    const b64 = Buffer.from(json).toString("base64");
    expect(readFragment("#p=" + b64)).toBe(json);
  });
  it("accepts zlib-wrapped deflate", () => {
    expect(decodePayload(toBase64Url(zlibSync(strToU8(json))))).toBe(json);
  });
  it("accepts raw JSON in the fragment", () => {
    expect(readFragment("#p=" + encodeURIComponent(json))).toBe(json);
  });
  it("returns null for garbage", () => {
    expect(readFragment("#p=%%%")).toBeNull();
    expect(readFragment("#x=1")).toBeNull();
  });
});
