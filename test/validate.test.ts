import { describe, expect, it } from "vitest";
import { analyze } from "../src/validate";
import { presets, presetJson } from "../src/presets";

describe("analyze", () => {
  it("accepts every preset without errors", () => {
    for (const p of presets) {
      const a = analyze(presetJson(p));
      expect(a.kind, p.id).toBe("ok");
      if (a.kind === "ok") expect(a.warnings, p.id).toEqual([]);
    }
  });
  it("reports syntax errors with line and column", () => {
    const a = analyze('{\n  "components": [\n    { "type": 10 "content": "x" }\n  ]\n}');
    expect(a.kind).toBe("syntax");
    if (a.kind === "syntax") expect(a.errors[0]).toMatchObject({ line: 3 });
  });
  it("rejects trailing commas and comments", () => {
    expect(analyze('{"components": [],}').kind).toBe("syntax");
    expect(analyze('// hi\n{"components": []}').kind).toBe("syntax");
  });
  it("reports structure errors with a path and position", () => {
    const text = JSON.stringify({ flags: 32768, components: [{ type: 9, components: [{ type: 10, content: "a" }] }] }, null, 2);
    const a = analyze(text);
    expect(a.kind).toBe("structure");
    if (a.kind === "structure") {
      expect(a.errors[0].message).toMatch(/accessory/);
      expect(a.errors[0].line).toBe(4);
    }
  });
  it("accepts a bare component array and warns about API rules", () => {
    const a = analyze(JSON.stringify([{ type: 1, components: [{ type: 2, style: 1, label: "x" }] }]));
    expect(a.kind).toBe("ok");
    if (a.kind === "ok") {
      expect(a.rootPath).toEqual([]);
      expect(a.warnings.map((w) => w.message).join()).toMatch(/custom_id/);
    }
  });
  it("lets unknown types through for the raw fallback", () => {
    const a = analyze(JSON.stringify({ flags: 32768, components: [{ type: 99 }] }));
    expect(a.kind).toBe("ok");
  });
  it("warns when the V2 flag is missing", () => {
    const a = analyze(JSON.stringify({ components: [{ type: 10, content: "x" }] }));
    expect(a.kind === "ok" && a.warnings[0].message).toMatch(/32768/);
  });
  it("explains a single component", () => {
    const a = analyze(JSON.stringify({ type: 10, content: "x" }));
    expect(a.kind === "structure" && a.errors[0].message).toMatch(/single component/);
  });
});

describe("analyze: classic messages", () => {
  const ok = (payload: unknown) => {
    const a = analyze(JSON.stringify(payload));
    if (a.kind !== "ok") throw new Error(JSON.stringify(a));
    return a;
  };
  const messages = (payload: unknown) => ok(payload).warnings.map((w) => w.message).join("\n");

  it("accepts content only, embeds only and content + embeds + action rows without warnings", () => {
    expect(ok({ content: "hi" }).warnings).toEqual([]);
    expect(ok({ embeds: [{ title: "t" }] }).warnings).toEqual([]);
    const a = ok({ content: "hi", embeds: [{ description: "d" }], components: [{ type: 1, components: [{ type: 2, style: 5, label: "x", url: "https://e.com" }] }] });
    expect(a.warnings).toEqual([]);
    expect(a.stats).toMatchObject({ mode: "classic", contentLength: 2, embeds: 1, embedLength: 1 });
  });
  it("warns that V2 drops content and embeds", () => {
    const m = messages({ flags: 32768, content: "hi", embeds: [{ title: "t" }], components: [{ type: 10, content: "x" }] });
    expect(m).toMatch(/"content" cannot be used with IS_COMPONENTS_V2/);
    expect(m).toMatch(/"embeds" cannot be used with IS_COMPONENTS_V2/);
  });
  it("warns when V2 components are mixed into a classic message", () => {
    const a = ok({ content: "hi", components: [{ type: 17, components: [{ type: 10, content: "x" }] }] });
    expect(a.stats.mode).toBe("v2");
    expect(a.warnings[0].message).toMatch(/32768/);
    expect(a.warnings.map((w) => w.message).join()).toMatch(/content/);
  });
  it("checks embed limits and shapes", () => {
    const m = messages({
      embeds: [
        { title: "x".repeat(257), color: -1, timestamp: "yesterday", fields: [{ name: "a" }], footer: {}, image: { url: "ftp://x" } },
        {},
      ],
    });
    for (const re of [/title is 257/, /color must be an integer/, /timestamp must be an ISO 8601/, /non-empty "name" and "value"/, /footer requires/, /image\.url must start with/, /empty embed/]) {
      expect(m).toMatch(re);
    }
  });
  it("checks message-level limits", () => {
    expect(messages({ content: "x".repeat(2001) })).toMatch(/at most 2000/);
    expect(messages({ embeds: Array.from({ length: 11 }, () => ({ title: "t" })) })).toMatch(/at most 10/);
    expect(messages({ embeds: [{ description: "x".repeat(4000) }, { description: "x".repeat(2001) }] })).toMatch(/at most 6000/);
    expect(messages({ content: "" })).toMatch(/no content, embeds, or components/);
    const rows = Array.from({ length: 6 }, () => ({ type: 1, components: [{ type: 2, style: 5, label: "x", url: "https://e.com" }] }));
    expect(messages({ components: rows })).toMatch(/5 per message/);
  });
  it("explains a bare embed and an empty object", () => {
    const a = analyze(JSON.stringify({ title: "t", description: "d" }));
    expect(a.kind === "structure" && a.errors[0].message).toMatch(/single embed/);
    const b = analyze("{}");
    expect(b.kind === "structure" && b.errors[0].message).toMatch(/content", "embeds", or "components/);
  });
  it("does not render content or embeds when suppressed by V2, but keeps them in the message", () => {
    const a = ok({ content: "hi", embeds: [{ title: "t" }] });
    expect(a.message.content).toBe("hi");
    expect(a.message.components).toEqual([]);
  });
});
