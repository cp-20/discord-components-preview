# Message Preview for Discord

Edit a Discord message payload in your browser with a live preview styled like the Discord client: plain **content**, **embeds**, **Action Rows**, and **Components V2**.
Share any payload as a link; nothing is sent to a server.

**https://discord.cp20.dev**

| Page | Description |
| --- | --- |
| [`/`](https://discord.cp20.dev) | JSON editor with live preview, API validation, and shareable links |
| [`/gallery`](https://discord.cp20.dev/gallery) | Rendered message examples that open in the editor |
| [`/docs`](https://discord.cp20.dev/docs) | Reference for supported payload fields, components, and Discord API limits |
| [`/llms.txt`](https://discord.cp20.dev/llms.txt) | Reference and ready-to-open example links for AI agents (see `src/share.ts` for link encoding) |
| [`/p3-dictionary.txt`](https://discord.cp20.dev/p3-dictionary.txt) | Raw bytes of the compression dictionary |

`/llms.txt` is generated from source at build time (`src/llms.ts`, `src/spec.ts`), so it stays in sync with the site.

## Usage

1. Paste or write a JSON payload in the editor on the left. Supported formats:
   - a Discord message payload object `{ "content", "embeds", "components", "flags" }` as sent to the API (webhook `username` and `avatar_url` override the author in the preview)
   - a top-level array of components `[ { "type": 17, ... } ]`
2. The preview on the right updates as you type. It uses the dark theme by default; click the sun/moon button to switch both the interface and the preview to light mode.
3. **Copy link** (<kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd>) copies a shareable URL containing the current payload. The address bar updates automatically as you edit.
4. **Examples** loads a preset payload (press <kbd>Ctrl</kbd>+<kbd>Z</kbd> to undo). **Format** pretty-prints the JSON. **Inspect** lets you click an element in the preview (content, an embed, or a component) to highlight its JSON in the editor.

Validation issues are reported at two levels:

- **Errors** (invalid JSON or missing required structure that prevents rendering) replace the preview with a list of issues. Each item shows `line:column` and jumps to that position in the editor.
- **Warnings** (Discord API validation issues that can still be previewed) appear below the preview, including Components V2 without `flags: 32768`, `content` or `embeds` combined with `IS_COMPONENTS_V2` (ignored in the preview as Discord rejects them), oversized embed fields, more than 10 embeds or 6,000 embed characters, more than 5 buttons in an Action Row, and more than 40 components total.

On mobile screens, the editor and preview are separated into tabs.

## What is rendered

**Message**: author header, `content` with Discord markdown (emoji-only messages render at a larger size), embeds, and components. Message `flags`: `4` (`SUPPRESS_EMBEDS`) hides embeds, `64` (`EPHEMERAL`) adds the "Only you can see this" notice, and `32768` (`IS_COMPONENTS_V2`) switches to Components V2.

**Embeds**: colored left border, author (with icon and link), title (with link), description, fields with Discord's inline grid (3 per row, or 2 next to a thumbnail), thumbnail, image, and footer with icon and `timestamp` ("Today at …").

**Components**

| Type | Component | Rendering |
| ---: | --- | --- |
| 17 | Container | `accent_color` border and `spoiler` blur |
| 10 | Text Display | Discord markdown |
| 9 | Section | 1–3 Text Displays with a Thumbnail or Button accessory |
| 11 | Thumbnail | `description` as alt text and `spoiler` blur |
| 12 | Media Gallery | Discord's 1–10 item grid layouts and `spoiler` blur |
| 14 | Separator | `divider` line and `spacing` (`1` small, `2` large) |
| 1 | Action Row | Buttons wrap as in the Discord client |
| 2 | Button | All 6 styles, `disabled` state, and Unicode or custom `emoji`; clicking non-link buttons displays their `custom_id` |
| 3, 5–8 | Select menus | String Select opens its options (`emoji`, `description`, `default`); other select types show the placeholder |
| 13 | File | `attachment://` file card |
| Other | Fallback | `type N` label with raw JSON |

**Markdown**: `#`/`##`/`###` headings, `-#` subtext, `**bold**`, `*italic*`, `__underline__`, `~~strikethrough~~`, `||spoiler||`, `` `inline code` ``, fenced code blocks, `>` and `>>>` block quotes, nested lists, `[masked](https://…)` and plain links, `<@user>`, `<@&role>`, `<#channel>`, `</command:id>`, `@everyone`/`@here`, and `<t:unix:style>` timestamps.

**Custom emoji**: `<:name:id>` and `<a:name:id>` in `content`, Text Display components, and embed text, plus `{ "id", "name", "animated" }` on buttons and select menu options, load from `https://cdn.discordapp.com/emojis/<id>.webp` (or `.gif` when animated). If the CDN returns 404, the raw emoji syntax is shown as an inline code chip.

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
