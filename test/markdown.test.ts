import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown } from "../src/markdown";

describe("markdown", () => {
  it("parses headings, subtext, lists and paragraphs", () => {
    const b = parseMarkdown("# Title\nplain\n-# small\n- a\n  - b\n1. one");
    expect(b.map((x) => x.t)).toEqual(["h", "p", "sub", "list", "list"]);
    const list = b[3] as any;
    expect(list.items[0].length).toBe(2); // nested list
  });
  it("needs a space after #", () => {
    expect(parseMarkdown("#nope")[0].t).toBe("p");
  });
  it("parses inline styles", () => {
    expect(parseInline("**b** *i* __u__ ~~s~~ ||sp|| `c`").filter((n) => n.t !== "text").map((n) => n.t)).toEqual([
      "b",
      "i",
      "u",
      "s",
      "spoiler",
      "code",
    ]);
    expect(parseInline("***bi***")[0]).toMatchObject({ t: "b", c: [{ t: "i" }] });
  });
  it("parses links, mentions, emoji and timestamps", () => {
    const n = parseInline("[site](https://a.b/c) https://x.y/z. <@123> <#9> <:wave:42> <t:0:R>");
    expect(n.filter((x) => x.t !== "text").map((x) => x.t)).toEqual(["link", "link", "mention", "mention", "emoji", "time"]);
    expect(n.find((x) => x.t === "link" && x.href === "https://x.y/z")).toBeTruthy();
  });
  it("handles nested styles whose text starts other rules", () => {
    expect(parseInline("[Changelog](https://example.com/c) **see https://a.b/c**")[0]).toMatchObject({ t: "link", href: "https://example.com/c" });
  });
  it("leaves snake_case alone", () => {
    expect(parseInline("custom_id_value")).toEqual([{ t: "text", v: "custom_id_value" }]);
  });
  it("keeps code blocks verbatim", () => {
    const b = parseMarkdown("before\n```js\nconst a = **1**\n```\nafter");
    expect(b.map((x) => x.t)).toEqual(["p", "pre", "p"]);
    expect((b[1] as any).v).toBe("const a = **1**");
    expect((b[1] as any).lang).toBe("js");
  });
  it("parses quotes", () => {
    const b = parseMarkdown("> quoted **x**\nnot");
    expect(b.map((x) => x.t)).toEqual(["quote", "p"]);
  });
});

describe("markdown robustness", () => {
  it("terminates and keeps all text on random markup soup", () => {
    const alphabet = ["*", "**", "_", "__", "~~", "||", "`", "[", "](", "https://a.b/", "<@1>", "<t:1:R>", "\\", "# ", "-# ", "> ", "- ", "\n", "a", "ほ", " "];
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let n = 0; n < 2000; n++) {
      let s = "";
      for (let k = 0; k < 24; k++) s += alphabet[Math.floor(rand() * alphabet.length)];
      expect(() => parseMarkdown(s)).not.toThrow();
    }
  });
});
