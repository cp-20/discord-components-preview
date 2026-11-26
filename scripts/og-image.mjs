// Renders the social image and the bitmap icons from their sources:
//   scripts/og/og.html -> public/og.png (1200x630)
//   public/favicon.svg -> public/apple-touch-icon.png (180x180, full bleed), public/favicon.ico (16+32)
// Usage: pnpm og
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const browser = await chromium.launch();

const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.goto(pathToFileURL(root + "scripts/og/og.html").href);
await og.evaluate(() => document.fonts.ready);
writeFileSync(root + "public/og.png", await og.screenshot({ type: "png" }));

const svg = readFileSync(root + "public/favicon.svg", "utf8");
async function icon(size, fullBleed) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // iOS rounds the touch icon itself, so that one is drawn square
  const body = fullBleed ? svg.replace(/rx="5"/, 'rx="0"') : svg;
  await page.setContent(`<style>*{margin:0}html,body{background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${body}`);
  const png = await page.screenshot({ type: "png", omitBackground: !fullBleed });
  await page.close();
  return png;
}
writeFileSync(root + "public/apple-touch-icon.png", await icon(180, true));

// ICO with embedded PNGs
const pngs = [await icon(16, false), await icon(32, false)];
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const size = [16, 32][i], at = 6 + 16 * i;
  header.writeUInt8(size, at); header.writeUInt8(size, at + 1);
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(png.length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += png.length;
});
writeFileSync(root + "public/favicon.ico", Buffer.concat([header, ...pngs]));

await browser.close();
console.log("wrote public/og.png, public/apple-touch-icon.png, public/favicon.ico");
