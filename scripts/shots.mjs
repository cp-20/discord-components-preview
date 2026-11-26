// Visual check: renders each preset in both themes and on a phone, saving PNGs.
// Usage: node scripts/shots.mjs <baseUrl> <outDir>
import { chromium } from "playwright";
import zlib from "node:zlib";
import { readFileSync, mkdirSync } from "node:fs";

const [base = "http://localhost:4789", out = "shots"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
// Links are built the way /llms.txt tells agents to, with the dictionary the site serves
const dictionary = Buffer.from(await (await fetch(base + "/p2-dictionary.txt")).arrayBuffer());
const enc = (s) => {
  let text = s;
  try {
    text = JSON.stringify(JSON.parse(s));
  } catch {}
  return zlib.deflateRawSync(Buffer.from(text), { level: 9, dictionary }).toString("base64url");
};
const extra = JSON.parse(readFileSync(new URL("./shot-cases.json", import.meta.url), "utf8"));

const browser = await chromium.launch();
const cases = [
  { name: "default-dark", hash: "", theme: "dark" },
  { name: "default-light", hash: "", theme: "light" },
  { name: "view-gallery-dark", path: "/gallery", hash: "", theme: "dark" },
  { name: "view-gallery-light", path: "/gallery", hash: "", theme: "light" },
  { name: "view-docs-dark", path: "/docs", hash: "", theme: "dark" },
  ...Object.entries(extra).map(([name, payload]) => ({ name, hash: "#p2=" + enc(typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)), theme: "dark" })),
];
for (const c of cases) {
  for (const vp of [{ tag: "desk", width: 1440, height: 900 }, ...(/^(default|view-)/.test(c.name) ? [{ tag: "phone", width: 390, height: 844, mobile: true }] : [])]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await ctx.addInitScript((t) => localStorage.setItem("theme", t), c.theme);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => console.log("pageerror", c.name, e.message));
    page.on("console", (m) => m.type() === "error" && console.log("console", c.name, m.text().slice(0, 160)));
    await page.goto(base + (c.path ?? "/") + c.hash);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/${c.name}-${vp.tag}.png`, fullPage: !!c.path && !vp.mobile });
    if (vp.mobile && !c.path) {
      await page.getByRole("tab", { name: "Editor" }).click();
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${out}/${c.name}-${vp.tag}-editor.png` });
    }
    await ctx.close();
  }
}
// Interactions: examples menu, inspect hover, copy link round-trip
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Examples" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/menu.png` });
  await page.getByRole("menuitem", { name: /Action rows/ }).click();
  await page.getByRole("button", { name: "Inspect" }).click();
  await page.locator(".dc-pick:has(> .dc-btn.danger)").hover();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${out}/inspect.png` });
  await page.locator(".dc-pick:has(> .dc-btn.danger)").click();
  await page.waitForTimeout(150);
  const sel = await page.evaluate(() => {
    const v = document.querySelector(".cm-content")?.cmView?.view ?? null;
    return document.querySelector(".cm-activeLine")?.textContent ?? "";
  });
  console.log("inspect jumped to line:", sel.trim());
  await page.getByRole("button", { name: /Copy link/ }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  console.log("copied", url.slice(0, 60), url.length);
  const p2 = await ctx.newPage();
  await p2.goto(url);
  await p2.waitForTimeout(300);
  console.log("roundtrip danger button:", await p2.locator(".dc-btn.danger").count());
  await ctx.close();
}
await browser.close();
console.log("ok", cases.length);
