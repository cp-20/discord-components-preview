// Builds /llms.txt: everything an agent needs to make links and look up payload shapes without the UI.
import { DICTIONARY, DICTIONARY_VERSION } from "./dictionary";
import { presets } from "./presets";
import { shareUrl } from "./share";
import { SITE, buttonStyles, componentSpecs, embedFields, emojiRules, flagRows, limits, markdownSyntax, messageFields, v2Rules, type Row } from "./spec";

const table = (head: [string, string, string], rows: Row[]) =>
  [`| ${head.join(" | ")} |`, "| --- | --- | --- |", ...rows.map((r) => `| \`${r.key}\` | ${r.type} | ${r.notes} |`)].join("\n");

export function dictionaryBytes(): number {
  return new TextEncoder().encode(DICTIONARY).length;
}

export function buildLlmsTxt(sha256: string): string {
  const examples = presets
    .map((p) => {
      const json = JSON.stringify(p.payload);
      return [`### ${p.name} (${p.kind === "v2" ? "Components V2" : "classic"})`, p.summary, "", `Link: ${shareUrl(SITE + "/", json)}`, "", "```json", json, "```"].join("\n");
    })
    .join("\n\n");

  return `# Discord Message Preview

> Browser tool at ${SITE} that renders a Discord message payload (content, embeds, components, Components V2) the way the Discord client draws it, validates it against Discord's rules, and shares it as a link. The payload travels in the URL fragment, so it never reaches a server. No account or API key.

Use it to:
- make a link that opens a payload in the editor: \`${SITE}/#p2=<encoded>\` (algorithm below, no UI needed)
- look up the shape of content, embeds and components (sections below)
- show a person what a bot or webhook message will look like before sending it

Pages: \`/\` editor with live preview, \`/gallery\` examples, \`/docs\` human-readable docs, \`/llms.txt\` this file, \`/p2-dictionary.txt\` the compression dictionary as raw bytes.

## Making a link (#p2=)

This is the only link format the site reads.

1. Serialize the payload as JSON. Minified is shortest: \`JSON.stringify(payload)\` or Python \`json.dumps(payload, ensure_ascii=False, separators=(",", ":"))\`. Any valid JSON is accepted; the editor pretty-prints it on open.
2. Encode the JSON text as UTF-8.
3. Compress with raw DEFLATE (RFC 1951: no zlib or gzip header and no checksum, 32 KiB window) using the DICTIONARY below as the preset dictionary. Any compression level works; 9 gives the shortest links.
4. Encode the bytes as base64url (RFC 4648 §5, \`-\` and \`_\`) and remove \`=\` padding.
5. The link is \`${SITE}/#p2=<result>\`.

Decoding is the reverse: base64url-decode, raw-inflate with the same dictionary, UTF-8 decode. A stream made without the dictionary still decodes, it is just longer. A dictionary-compressed stream can't be inflated without it.

Python:

\`\`\`python
import base64, json, zlib, urllib.request
DICT = urllib.request.urlopen("${SITE}/p2-dictionary.txt").read()   # or paste the JSON string below, .encode("utf-8")
def p2_link(payload):
    c = zlib.compressobj(9, zlib.DEFLATED, -15, zdict=DICT)          # -15 = raw deflate
    raw = c.compress(json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()) + c.flush()
    return "${SITE}/#p2=" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
def p2_decode(value):
    d = zlib.decompressobj(-15, zdict=DICT)
    return json.loads(d.decompress(base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))) + d.flush())
\`\`\`

Node.js (built-in zlib):

\`\`\`js
import zlib from "node:zlib";
const DICT = Buffer.from(DICTIONARY_JSON_STRING, "utf8");             // the JSON string literal below
const link = (payload) =>
  "${SITE}/#p2=" + zlib.deflateRawSync(Buffer.from(JSON.stringify(payload)), { level: 9, dictionary: DICT }).toString("base64url");
\`\`\`

Browser (fflate, what the site itself uses): \`toBase64Url(deflateSync(strToU8(json), { level: 9, dictionary: strToU8(DICTIONARY) }))\`.

### Dictionary (version ${DICTIONARY_VERSION})

The dictionary is the UTF-8 encoding of the string below (a JSON string literal; parse it to get the exact text, there is no trailing newline). ${dictionaryBytes()} bytes, SHA-256 \`${sha256}\`. The same bytes are served at ${SITE}/p2-dictionary.txt. It holds common Japanese punctuation and words, then minified JSON phrases frequent in Discord payloads, rarest first. It is frozen: a new dictionary would get a new prefix (#p3=).

\`\`\`json
${JSON.stringify(DICTIONARY)}
\`\`\`

## Payload: message object

The editor accepts a message object as sent to the Discord API (create message, webhook execute, interaction response \`data\`), or a bare array of components.

${table(["key", "type", "notes"], messageFields)}

### Flags

${table(["value", "name", "notes"], flagRows)}

### Classic vs Components V2

${v2Rules.map((r) => `- ${r}`).join("\n")}

## Content markdown

Used in content, Text Display, embed description and field values (titles and field names take inline styles only).

${markdownSyntax.map(([syntax, what]) => `- \`${syntax}\`: ${what}`).join("\n")}

## Embeds

\`embeds\` is an array of rich embeds. All keys are optional, but an embed needs at least one of title, description, fields, author, footer, image or thumbnail. Images accept http(s) URLs (attachment:// is shown as a placeholder).

${table(["key", "type", "notes"], embedFields)}

## Components

Button styles: ${buttonStyles}.

| type | name | keys | allowed in | V2 only |
| ---: | --- | --- | --- | --- |
${componentSpecs.map((c) => `| ${c.type} | ${c.name} | ${c.keys} | ${c.where} | ${c.v2 ? "yes" : "no"} |`).join("\n")}

Unknown types are shown as raw JSON in the preview (useful for debugging); types 4 (Text Input), 18 (Label) and 19 (File Upload) belong to modals and are flagged.

## Custom emoji

${emojiRules.map((r) => `- ${r}`).join("\n")}

## Limits the validator checks

${limits.map(([what, max]) => `- ${what}: ${max}`).join("\n")}

Errors (invalid JSON, or a shape that can't be drawn) replace the preview with a list. Warnings (things Discord's API would reject) are listed under the preview with line:column.

## Examples

Each example is the full payload and a ready link.

${examples}
`;
}
