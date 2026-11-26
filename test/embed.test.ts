import { describe, expect, it } from "vitest";
import { embedTextLength, embedView, formatEmbedTimestamp, layoutFields } from "../src/embed";

const f = (name: string, inline?: boolean) => ({ name, value: "v", inline });
const shape = (rows: ReturnType<typeof layoutFields>) => rows.map((r) => r.map((c) => `${c.name}@${c.column}`));

describe("embed fields", () => {
  it("packs inline fields three per row on the 12-column grid", () => {
    const rows = layoutFields([f("a", true), f("b", true), f("c", true), f("d", true)], false);
    expect(shape(rows)).toEqual([["a@1 / 5", "b@5 / 9", "c@9 / 13"], ["d@1 / 13"]]);
  });
  it("uses two per row next to a thumbnail", () => {
    const rows = layoutFields([f("a", true), f("b", true), f("c", true)], true);
    expect(shape(rows)).toEqual([["a@1 / 7", "b@7 / 13"], ["c@1 / 13"]]);
  });
  it("gives non-inline fields a row of their own and breaks inline runs", () => {
    const rows = layoutFields([f("a", true), f("b"), f("c", true), f("d", false), f("e", true)], false);
    expect(shape(rows)).toEqual([["a@1 / 13"], ["b@1 / 13"], ["c@1 / 13"], ["d@1 / 13"], ["e@1 / 13"]]);
    expect(rows.flat().map((c) => c.index)).toEqual([0, 1, 2, 3, 4]);
  });
  it("skips fields that aren't objects but keeps original indexes", () => {
    const rows = layoutFields([null as any, f("b", true)], false);
    expect(rows.flat()[0]).toMatchObject({ name: "b", index: 1 });
  });
});

describe("embedView", () => {
  const now = new Date(2026, 10, 27, 18, 0);
  it("collects every part the client draws", () => {
    const v = embedView(
      {
        author: { name: "Club", icon_url: "https://x/a.png" },
        title: "T",
        url: "https://example.com",
        description: "D",
        color: 0xe0795f,
        fields: [f("a", true), f("b", true), f("c", true)],
        thumbnail: { url: "https://x/t.png" },
        image: { url: "https://x/i.png" },
        footer: { text: "F", icon_url: "https://x/f.png" },
        timestamp: new Date(2026, 10, 27, 9, 5).toISOString(),
      },
      now,
      "en-US",
    );
    expect(v).toMatchObject({
      color: "#e0795f",
      author: { name: "Club", iconUrl: "https://x/a.png" },
      title: "T",
      url: "https://example.com",
      description: "D",
      thumbnail: "https://x/t.png",
      image: "https://x/i.png",
      footer: { text: "F", iconUrl: "https://x/f.png", time: "Today at 9:05 AM" },
    });
    expect(v.fieldRows[0][0].column).toBe("1 / 7"); // thumbnail present
  });
  it("leaves the color bar default when color is missing", () => {
    expect(embedView({ title: "x" }).color).toBeNull();
    expect(embedView({ title: "x", color: 0 }).color).toBe("#000000");
  });
  it("shows a timestamp without footer text", () => {
    const v = embedView({ title: "x", timestamp: new Date(2026, 10, 26, 8, 0).toISOString() }, now, "en-US");
    expect(v.footer).toEqual({ text: undefined, iconUrl: undefined, time: "Yesterday at 8:00 AM" });
  });
  it("formats older dates with the day", () => {
    expect(formatEmbedTimestamp(new Date(2026, 0, 2, 13, 15).toISOString(), now, "en-US")).toBe("01/02/2026 1:15 PM");
    expect(formatEmbedTimestamp("not a date", now)).toBeNull();
  });
  it("counts the characters Discord limits to 6000", () => {
    expect(embedTextLength({ title: "ab", description: "cde", fields: [{ name: "f", value: "gh" }], footer: { text: "i" }, author: { name: "jk" } })).toBe(11);
  });
});
