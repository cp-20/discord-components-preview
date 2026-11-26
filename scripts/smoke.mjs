// End-to-end check of the main flows against a running site (local preview or production).
// Usage: node scripts/smoke.mjs [baseUrl]
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import zlib from "node:zlib";

const base = (process.argv[2] ?? "http://localhost:4173").replace(/\/$/, "");
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

// Agent docs, read the way an agent would
const llms = await (await fetch(base + "/llms.txt")).text();
const dictionary = Buffer.from(await (await fetch(base + "/p2-dictionary.txt")).arrayBuffer());
const published = JSON.parse(/### Dictionary[\s\S]*?```json\n(.*)\n```/.exec(llms)?.[1] ?? '""');
check("llms.txt documents #p2= and the dictionary", llms.includes("#p2=") && Buffer.from(published, "utf8").equals(dictionary));
check("dictionary hash matches llms.txt", llms.includes(createHash("sha256").update(dictionary).digest("hex")));

const payload = { content: "smoke <:check:921544057312915498>", embeds: [{ title: "Smoke test", color: 5793266, fields: [{ name: "a", value: "1", inline: true }] }] };
const agentLink = base + "/#p2=" + zlib.deflateRawSync(Buffer.from(JSON.stringify(payload)), { level: 9, dictionary }).toString("base64url");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const editorText = () => page.evaluate(() => document.querySelector(".cm-content")?.cmView?.view?.state.doc.toString() ?? document.querySelector(".cm-content")?.textContent ?? "");

// 1. A link built from /llms.txt opens in the editor
await page.goto(agentLink);
await page.waitForSelector(".dc-embed");
check("agent-built link renders content and embed", (await page.locator(".dc-embed-title").textContent()) === "Smoke test");

// 2. Presets
await page.getByRole("button", { name: "Examples" }).click();
await page.getByRole("menuitem", { name: /Rich embed/ }).click();
await page.waitForTimeout(300);
check("preset loads: rich embed with fields and footer", (await page.locator(".dc-embed-field").count()) === 4 && (await page.locator(".dc-embed-footer").count()) === 1);
await page.waitForTimeout(400);
check("address bar carries #p2=", /#p2=[A-Za-z0-9_-]+$/.test(page.url()));

// 3. Share link round trip
await page.getByRole("button", { name: /Copy link/ }).click();
const copied = await page.evaluate(() => navigator.clipboard.readText());
const before = await editorText();
const p2 = await ctx.newPage();
await p2.goto(copied);
await p2.waitForSelector(".dc-embed");
const after = await p2.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
check("copied link reopens the same payload", copied.includes("#p2=") && after.replace(/\s/g, "") === before.replace(/\s/g, ""), `${copied.length} chars`);
await p2.close();

// 4. Gallery -> editor
await page.goto(base + "/gallery");
await page.waitForSelector(".example");
const cards = await page.locator(".example").count();
const emojiCard = page.locator(".example", { hasText: "Custom emoji" });
await emojiCard.getByRole("link", { name: "Open in editor" }).click();
await page.waitForSelector(".editor-host .cm-content");
await page.waitForTimeout(1500);
check("gallery shows every example", cards >= 10, `${cards} cards`);
check("gallery 'Open in editor' lands on /#p2=", new URL(page.url()).pathname === "/" && page.url().includes("#p2="));
check("editor holds the gallery payload", (await editorText()).includes("catvibe"));
const loaded = await page.$$eval(".dc-emoji, .dc-btn-emoji", (els) => els.filter((e) => e.tagName === "IMG" && e.complete && e.naturalWidth > 0).length);
const chips = await page.locator(".dc-emoji-chip").count();
check("custom emoji load from the CDN", loaded >= 5, `${loaded} images`);
check("missing emoji falls back to a code chip", chips >= 2, `${chips} chips`);

// 5. Select menu opens
await page.getByRole("button", { name: "Examples" }).click();
await page.getByRole("menuitem", { name: /Select menus/ }).click();
await page.locator(".dc-select", { hasText: "Deploys" }).click();
check("string select opens its options", (await page.locator(".dc-opt").count()) === 3);

// 6. Docs
await page.goto(base + "/docs");
await page.waitForSelector("#links");
check("docs show the dictionary", (await page.locator(".code pre", { hasText: "allowed_mentions" }).count()) === 1);

// 7. Retired links are rejected with a notice
await page.goto(base + "/#p=" + zlib.deflateRawSync(Buffer.from('{"content":"x"}')).toString("base64url"));
check("retired #p= link shows a notice", await page.locator(".toast", { hasText: "retired" }).isVisible());

check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
