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
