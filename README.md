# Message Preview for Discord

Edit a Discord message payload in the browser and see it drawn like the Discord client, live: plain **content**, classic **embeds**, **Action Rows**, and **Components V2**.
Share any payload as a link; the JSON travels in the URL fragment, so it never reaches the server.

**https://discord.cp20.dev**

| Page | What it is |
| --- | --- |
| [`/`](https://discord.cp20.dev) | Editor with live preview, validation and share links |
| [`/gallery`](https://discord.cp20.dev/gallery) | Every example, rendered, each with *Open in editor* |
| [`/docs`](https://discord.cp20.dev/docs) | Formats, limits and the link format, for people |
| [`/llms.txt`](https://discord.cp20.dev/llms.txt) | The same for AI agents: link algorithm, exact dictionary, every format, example links |
| [`/p3-dictionary.txt`](https://discord.cp20.dev/p3-dictionary.txt) | The compression dictionary as raw bytes |

`/llms.txt` is generated from the source at build time (`src/llms.ts`, `src/spec.ts`), so it always matches what the site does.

## Usage

1. Paste or write a payload in the editor (left). Accepted shapes:
   - a message object `{ "content", "embeds", "components", "flags" }` as sent to the API (webhook `username` / `avatar_url` are used for the author)
   - a bare array of components `[ { "type": 17, ... } ]`
2. The preview (right) updates on every keystroke. Dark by default; the sun/moon button switches the tool and the preview to light.
3. **Copy link** (<kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd>) copies a URL with the current payload. The address bar is kept in sync too.
4. **Examples** loads a preset (undo with <kbd>Ctrl</kbd>+<kbd>Z</kbd>). **Format** pretty-prints the JSON. **Inspect** lets you click any part of the preview (content, an embed, a component) to select its JSON.

Problems are reported in two levels:

- **Errors** (invalid JSON, or a shape that can't be drawn) replace the preview with a list. Each entry shows `line:column` and jumps to the spot.
- **Warnings** (things Discord's API would reject but that can still be drawn) are listed under the preview: a V2 component without `flags: 32768`, `content`/`embeds` together with the V2 flag (Discord rejects them, so the preview leaves them out), over-long embed fields, more than 10 embeds or 6000 embed characters, more than 5 buttons in a row, more than 40 components, …

On phones the editor and the preview are two tabs.

## What is rendered

**Message**: author line, `content` with Discord markdown (emoji-only content is drawn large), embeds, then components. `flags`: 4 hides embeds, 64 adds the ephemeral "Only you can see this" line, 32768 switches to Components V2.

**Embeds**: color bar, author (icon, link), title (link), description, fields with Discord's inline layout (3 per row, 2 next to a thumbnail), thumbnail, image, footer with icon and `timestamp` ("Today at …").

**Components**

| type | Component | Rendering |
| ---: | --- | --- |
| 17 | Container | `accent_color` bar, `spoiler` blur |
| 10 | Text Display | Discord markdown |
| 9 | Section | 1–3 Text Displays + accessory (Thumbnail or Button) |
| 11 | Thumbnail | `description` as alt, `spoiler` |
| 12 | Media Gallery | Discord's 1–10 item layouts, `spoiler` |
| 14 | Separator | `divider`, `spacing` 1 / 2 |
| 1 | Action Row | buttons wrap like the client |
| 2 | Button | all 6 styles, `disabled`, unicode or custom `emoji`; non-link buttons show their `custom_id` when clicked |
| 3, 5–8 | Select menus | String Select opens its options (emoji, description, `default`); others show the placeholder |
| 13 | File | `attachment://` name card |
| other | Fallback | "type N" label with the raw JSON |

**Markdown**: `#`/`##`/`###`, `-#` subtext, `**bold**`, `*italic*`, `__underline__`, `~~strike~~`, `||spoiler||`, `` `code` ``, fenced code, `>` / `>>>` quotes, nested lists, `[masked](https://…)` and bare links, `<@user>`, `<@&role>`, `<#channel>`, `</command:id>`, `@everyone`/`@here`, `<t:unix:style>` timestamps.

**Custom emoji**: `<:name:id>` and `<a:name:id>` in content, Text Displays and embed text, and `{ "id", "name", "animated" }` on buttons and select options, load from `https://cdn.discordapp.com/emojis/<id>.webp` (`.gif` when animated). If the CDN returns 404, the raw code is shown as a chip.

## Share link format

```
https://discord.cp20.dev/#p3=<payload>
payload = base64url( deflate-raw( UTF-8( minified JSON ), dictionary = DICTIONARY ) )   // no padding
```

- Raw DEFLATE (RFC 1951, no zlib header) with a **preset dictionary** (`src/dictionary.ts`, 6,554 bytes, version 2): common Japanese and English words, then minified JSON phrases common in Discord payloads, rarest first. The dictionary is frozen; a different one would need a new prefix (`#p4=`).
- The JSON is minified before compressing and pretty-printed when a link is opened.
- `#p3=` is the only format the site reads. Links in the retired `#p=` and `#p2=` formats show a notice instead of a payload.

Fragment length in characters, `#p2=` (version 1 dictionary, 1,993 bytes) vs `#p3=`. The text of a message is most of a link, so the larger dictionary helps most on ordinary prose; the bundled examples are dense with ids, hashes and URLs.

| set | `#p2=` | `#p3=` | change |
| --- | ---: | ---: | ---: |
| 10 bundled examples | 4,317 | 4,055 | −6.1% |
| 10 held-out payloads (`test/fixtures`) | 2,395 | 1,997 | −16.6% |

Also measured and not adopted: shortening JSON keys to one-letter tokens (−1.3%, and a custom transform agents would have to reimplement), brotli without a custom dictionary (+13%), zstd with the same dictionary (+5%), a 20 KB dictionary with 2,000 more English words (another −2% for three times the size).

`test/compression.test.ts` prints these numbers and checks no example gets longer. Generating a link elsewhere:

```python
import base64, json, zlib, urllib.request
DICT = urllib.request.urlopen("https://discord.cp20.dev/p3-dictionary.txt").read()
c = zlib.compressobj(9, zlib.DEFLATED, -15, zdict=DICT)          # -15 = raw deflate
raw = c.compress(json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()) + c.flush()
url = "https://discord.cp20.dev/#p3=" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
```

```js
import zlib from "node:zlib";
const DICT = Buffer.from(await (await fetch("https://discord.cp20.dev/p3-dictionary.txt")).arrayBuffer());
const url = "https://discord.cp20.dev/#p3=" +
  zlib.deflateRawSync(Buffer.from(JSON.stringify(payload)), { level: 9, dictionary: DICT }).toString("base64url");
```

The fragment (`#…`) is not part of HTTP requests, so payloads stay in the browser. The site is static files only; the last draft is kept in `localStorage` of your own browser.

## Development

```sh
pnpm install
pnpm dev          # Vite dev server (also serves /llms.txt and /p3-dictionary.txt)
pnpm check        # tsc + vitest
pnpm build        # -> dist/, including llms.txt, p3-dictionary.txt, robots.txt, sitemap.xml, gallery.html, docs.html
pnpm og           # re-render public/og.png (from scripts/og/og.html), apple-touch-icon.png, favicon.ico
pnpm exec vite preview --port 4173 &
node scripts/smoke.mjs http://localhost:4173          # main flows end to end (also works against production)
node scripts/shots.mjs http://localhost:4173 shots    # screenshots of the views and edge cases
```

Stack: Vite, Preact, CodeMirror 6, jsonc-parser (error positions), fflate (deflate with dictionary). No server code.

| File | Role |
| --- | --- |
| `src/share.ts`, `src/dictionary.ts` | `#p3=` encoding and the frozen dictionary |
| `src/seo.ts` | Per-route title/description, the `/gallery` and `/docs` shells, robots.txt, sitemap.xml (`index.html` holds the `/` tags; `test/seo.test.ts` keeps them in sync) |
| `src/validate.ts` | errors and warnings with source positions |
| `src/Preview.tsx`, `src/embed.ts`, `src/emoji.ts`, `src/markdown.ts` | the client look-alike |
| `src/spec.ts`, `src/llms.ts` | format tables shared by `/docs` and `/llms.txt` |
| `src/presets.ts` | examples for the menu, gallery, docs and llms.txt |

## Deploy (Cloudflare Workers, static assets)

`wrangler.jsonc` declares an assets-only Worker serving `./dist` with the custom domain `discord.cp20.dev`; unknown paths such as `/gallery` fall back to `index.html`.
Production is connected to Workers Builds: every push to `main` runs `pnpm run build` and `npx wrangler deploy` on Cloudflare. GitHub Actions only runs tests and the build. Manual deploy: `pnpm deploy`.

`public/_headers` sets a strict CSP (`script-src 'self'`). It also blocks the Cloudflare Web Analytics beacon if the zone injects it, which keeps share URLs out of third-party scripts. Emoji and images load from any https origin (`img-src *`).

Not affiliated with Discord. The preview imitates the client's look so you can check a layout before sending it.

## License

MIT
