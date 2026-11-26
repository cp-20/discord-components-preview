# Components V2 Preview

Edit a Discord **Components V2** payload in the browser and see it rendered like the Discord client, live.
Share any payload as a link; the JSON travels in the URL fragment, so it never reaches the server.

**https://discord.cp20.dev**

## Usage

1. Paste or write a message payload in the editor (left). Both forms are accepted:
   - a message object: `{ "flags": 32768, "components": [ ... ] }` (webhook `username` / `avatar_url` are used for the author)
   - a bare array of components: `[ { "type": 17, ... } ]`
2. The preview (right) updates on every keystroke. Dark theme by default; the sun/moon button switches both the tool and the preview to light.
3. **Copy link** (or <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd>) copies a URL that contains the current payload. The address bar is also kept in sync.
4. **Examples** loads a preset (undo with <kbd>Ctrl</kbd>+<kbd>Z</kbd>). **Format** pretty-prints the JSON.
5. **Inspect** lets you click any component in the preview to select its JSON in the editor.

Problems are reported in two levels:

- **Errors** (invalid JSON, or a shape that can't be rendered such as a Section without `accessory`) replace the preview with a list. Each entry shows `line:column` and jumps to the spot; the editor underlines it too.
- **Warnings** (things the API would reject but that can still be drawn: missing `flags: 32768`, a style 1–4 button without `custom_id`, more than 5 buttons in a row, more than 40 components or 4000 characters, …) are listed under the preview.

On phones the editor and the preview are two tabs.

## Supported components

| type | Component | Rendering |
| ---: | --- | --- |
| 17 | Container | `accent_color` bar, `spoiler` blur |
| 10 | Text Display | Discord markdown, see below |
| 9 | Section | 1–3 Text Displays + accessory (Thumbnail or Button) |
| 11 | Thumbnail | `description` as alt, `spoiler` |
| 12 | Media Gallery | Discord's 1–10 item layouts, `spoiler` |
| 14 | Separator | `divider` true/false, `spacing` 1 (small) / 2 (large) |
| 1 | Action Row | buttons wrap like the client |
| 2 | Button | Primary, Secondary, Success, Danger, Link (opens the URL), Premium; `disabled`; unicode or custom `emoji`. Clicking a non-link button shows its `custom_id` |
| 3, 5–8 | Select menus | placeholder only |
| 13 | File | `attachment://` name card |
| anything else | Fallback | "type N" label with the raw JSON, for debugging |

Markdown in Text Displays: `#`/`##`/`###` headings, `-#` subtext, `**bold**`, `*italic*`/`_italic_`, `__underline__`, `~~strike~~`, `||spoiler||`, `` `code` ``, fenced code blocks, `>` and `>>>` quotes, `-`/`*`/`1.` lists with nesting, `[masked](https://…)` and bare links, `<@user>`, `<@&role>`, `<#channel>`, `</command:id>`, `@everyone`/`@here`, custom emoji `<:name:id>`, and timestamps `<t:unix:t|T|d|D|f|F|R>`.

## Share link format

```
https://discord.cp20.dev/#p=<payload>
payload = base64url( deflate-raw( UTF-8 JSON ) )     // RFC 1951, no zlib header, no padding
```

When reading a link the following are also accepted, in this order of attempts:

1. raw deflate (above)
2. zlib-wrapped deflate (RFC 1950, e.g. Python `zlib.compress`)
3. uncompressed base64url **or** standard base64 of the UTF-8 JSON (padding optional)
4. plain URL-encoded JSON (`#p=%7B%22components%22...`)

Generating a link elsewhere:

```js
// Node / browser with fflate
import { deflateSync, strToU8 } from "fflate";
const p = Buffer.from(deflateSync(strToU8(JSON.stringify(payload)))).toString("base64url");
const url = `https://discord.cp20.dev/#p=${p}`;
```

```python
import base64, json, zlib
c = zlib.compressobj(9, zlib.DEFLATED, -15)          # -15 = raw deflate
raw = c.compress(json.dumps(payload).encode()) + c.flush()
url = "https://discord.cp20.dev/#p=" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
```

The fragment (`#…`) is not part of HTTP requests, so payloads stay in the browser. The site is static files only; the last draft is kept in `localStorage` of your own browser.

## Development

```sh
pnpm install
pnpm dev          # Vite dev server
pnpm check        # tsc + vitest
pnpm build        # -> dist/
node scripts/shots.mjs http://localhost:4173 shots   # screenshots of every preset (needs `pnpm vite preview`)
```

Stack: Vite, Preact, CodeMirror 6, jsonc-parser (error positions), fflate (deflate). No server code.

## Deploy (Cloudflare Workers, static assets)

`wrangler.jsonc` declares an assets-only Worker serving `./dist` with the custom domain `discord.cp20.dev`.

```sh
pnpm wrangler login   # once
pnpm deploy           # vite build && wrangler deploy
```

The custom domain is created on first deploy (the `cp20.dev` zone must be in the same Cloudflare account).

Production is also connected to Workers Builds: every push to `main` runs `pnpm run build` and `npx wrangler deploy` on Cloudflare. GitHub Actions only runs tests and the build.

`public/_headers` sets a strict CSP (`script-src 'self'`). It also blocks the Cloudflare Web Analytics beacon if the zone injects it, which keeps share URLs out of third-party scripts.

Not affiliated with Discord. The preview imitates the client's look so you can check a layout before sending it.

## License

MIT
