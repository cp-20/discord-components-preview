import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PAGES, SITE, htmlForRoute, robotsTxt, sitemapXml } from "../src/seo";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const meta = (html: string, attr: "name" | "property", key: string) =>
  new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html)?.[1];

describe("index.html head", () => {
  it("matches PAGES.editor", () => {
    expect(/<title>([^<]*)<\/title>/.exec(index)?.[1]).toBe(PAGES.editor.title);
    expect(meta(index, "name", "description")).toBe(PAGES.editor.description);
    expect(meta(index, "property", "og:title")).toBe(PAGES.editor.title);
    expect(meta(index, "property", "og:description")).toBe(PAGES.editor.description);
    expect(meta(index, "name", "twitter:description")).toBe(PAGES.editor.description);
  });

  it("has the full set of crawler tags, with absolute image URLs", () => {
    expect(index).toContain(`<link rel="canonical" href="${SITE}/" />`);
    expect(meta(index, "name", "robots")).toMatch(/^index, follow/);
    expect(meta(index, "name", "theme-color")).toBeTruthy();
    expect(meta(index, "property", "og:type")).toBe("website");
    expect(meta(index, "property", "og:url")).toBe(SITE + "/");
    expect(meta(index, "property", "og:image")).toBe(SITE + "/og.png");
    expect(meta(index, "property", "og:image:type")).toBe("image/png");
    expect(meta(index, "property", "og:image:width")).toBe("1200");
    expect(meta(index, "property", "og:image:height")).toBe("630");
    expect(meta(index, "name", "twitter:card")).toBe("summary_large_image");
    expect(meta(index, "name", "twitter:image")).toBe(SITE + "/og.png");
    for (const href of ["/favicon.svg", "/favicon.ico", "/apple-touch-icon.png"]) expect(index).toContain(`href="${href}"`);
  });

  it("has valid WebApplication JSON-LD", () => {
    const json = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(index)![1]);
    expect(json["@type"]).toBe("WebApplication");
    expect(json.url).toBe(SITE + "/");
    expect(json.description).toBe(PAGES.editor.description);
  });

  it("references the OG image and icons that exist in public/", () => {
    const png = readFileSync(new URL("../public/og.png", import.meta.url));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    readFileSync(new URL("../public/apple-touch-icon.png", import.meta.url));
    readFileSync(new URL("../public/favicon.ico", import.meta.url));
  });
});

describe("route shells", () => {
  for (const route of ["gallery", "docs"] as const) {
    it(`rewrites every page-specific tag for /${route}`, () => {
      const html = htmlForRoute(index, route);
      const page = PAGES[route];
      expect(html).toContain(`<title>${page.title}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${SITE}${page.path}" />`);
      expect(meta(html, "property", "og:url")).toBe(SITE + page.path);
      for (const key of ["og:title", "twitter:title"]) expect(meta(html, key.startsWith("og") ? "property" : "name", key)).toBe(page.title);
      for (const key of ["description", "twitter:description"]) expect(meta(html, "name", key)).toBe(page.description);
      expect(html).toContain(`<h1>${page.heading}</h1>`);
      expect(html).not.toContain(PAGES.editor.title);
      expect(meta(html, "property", "og:image")).toBe(SITE + "/og.png");
    });
  }
});

describe("robots.txt and sitemap.xml", () => {
  it("lists every page and points at the sitemap", () => {
    const xml = sitemapXml();
    for (const p of Object.values(PAGES)) expect(xml).toContain(`<loc>${SITE}${p.path}</loc>`);
    expect(robotsTxt()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robotsTxt()).toContain("/llms.txt");
  });
});
