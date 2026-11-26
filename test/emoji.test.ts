import { describe, expect, it } from "vitest";
import { emojiCode, emojiFromObject, emojiUrl, findEmojiCodes, parseEmojiCode } from "../src/emoji";
import { isJumbo, parseInline, parseMarkdown } from "../src/markdown";

describe("custom emoji", () => {
  it("parses still and animated codes", () => {
    expect(parseEmojiCode("<:check:921544057312915498>")).toEqual({ animated: false, name: "check", id: "921544057312915498" });
    expect(parseEmojiCode("<a:siren:1049837871772729354>")).toEqual({ animated: true, name: "siren", id: "1049837871772729354" });
    expect(parseEmojiCode("<:x:1>")).toBeNull(); // name needs 2+ characters
    expect(parseEmojiCode(":check:")).toBeNull();
  });
  it("finds codes inside text and markdown", () => {
    expect(findEmojiCodes("a <:ok:1> b <a:go:2>").map(emojiCode)).toEqual(["<:ok:1>", "<a:go:2>"]);
    expect(parseInline("**<:ok:12>**")).toEqual([{ t: "b", c: [{ t: "emoji", animated: false, name: "ok", id: "12" }] }]);
  });
  it("builds CDN urls: webp for still, gif for animated", () => {
    expect(emojiUrl({ id: "1", animated: false })).toBe("https://cdn.discordapp.com/emojis/1.webp?size=48");
    expect(emojiUrl({ id: "2", animated: true })).toBe("https://cdn.discordapp.com/emojis/2.gif?size=48");
  });
  it("reads component emoji objects", () => {
    expect(emojiFromObject({ name: "🎉" })).toEqual({ unicode: "🎉" });
    expect(emojiFromObject({ id: "654099753340239872", name: "catvibe", animated: true })).toEqual({ id: "654099753340239872", name: "catvibe", animated: true });
    expect(emojiFromObject({ id: 921544057312915498n.toString() })).toMatchObject({ name: "emoji" });
    expect(emojiFromObject({ id: "nope", name: "" })).toBeNull();
    expect(emojiFromObject(null)).toBeNull();
  });
  it("detects emoji-only content for jumbo size", () => {
    expect(isJumbo(parseMarkdown("<:a1:1> <a:b2:2>"))).toBe(true);
    expect(isJumbo(parseMarkdown("🎉 👍🏽"))).toBe(true);
    expect(isJumbo(parseMarkdown("ok <:a1:1>"))).toBe(false);
    expect(isJumbo(parseMarkdown("<:a1:1>\n\n- x"))).toBe(false);
  });
});
