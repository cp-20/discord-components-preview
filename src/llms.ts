// Builds /llms.txt: what an agent needs to use the tool for a person — what it does, which payloads it
// understands, and ready example links. How links are encoded lives in the source; this file points there.
import { presets } from "./presets";
import { shareUrl } from "./share";
import { REPO, SITE, buttonStyles, componentSpecs, embedFields, emojiSyntax, flagRows, markdownSyntax, messageFields, modes, type Row } from "./spec";

const table = (head: [string, string, string], rows: Row[]) =>
  [`| ${head.join(" | ")} |`, "| --- | --- | --- |", ...rows.map((r) => `| \`${r.key}\` | ${r.type} | ${r.notes} |`)].join("\n");

export function buildLlmsTxt(): string {
  const examples = presets
    .map((p) => {
      const json = JSON.stringify(p.payload);
      return [`### ${p.name} (${p.kind === "v2" ? "Components V2" : "classic"})`, p.summary, "", `Link: ${shareUrl(SITE + "/", json)}`, "", "```json", json, "```"].join("\n");
    })
    .join("\n\n");

  return `# Message Preview for Discord

> ${SITE} shows a Discord message payload (content, embeds, components, Components V2) the way the Discord client draws it, flags what Discord's API would reject, and shares it as a link. It runs in the browser; nothing is stored on a server. No account or API key.

Use it to:
- show a person what a bot or webhook message will look like before it is sent
- check a payload against Discord's rules (errors and warnings point to line:column)
- look up the shape of content, embeds and components (sections below)

Pages: \`/\` editor with live preview, \`/gallery\` examples, \`/docs\` the same reference for people.

## Sharing a payload

A share link looks like \`${SITE}/#p3=…\` and opens the payload in the editor.

- If an example below fits, give its ready link.
- Ask the person to paste the JSON into ${SITE} and press Copy link.
- Build the link in code: follow \`encodePayload\` in ${REPO}/blob/main/src/share.ts (the dictionary it uses is ${REPO}/blob/main/src/dictionary.ts).

## Message object

The editor accepts a message object as sent to the Discord API (create message, webhook execute, interaction response \`data\`), or a bare array of components.

${table(["key", "type", "notes"], messageFields)}

### Flags

${table(["value", "name", "notes"], flagRows)}

### Classic or Components V2

| | Classic | Components V2 |
| --- | --- | --- |
${modes.map(([what, classic, v2]) => `| ${what} | ${classic} | ${v2} |`).join("\n")}

## Content markdown

Used in content, Text Display, embed description and field values (titles and field names take inline styles only).

${markdownSyntax.map(([syntax, what]) => `- \`${syntax}\`: ${what}`).join("\n")}

## Embeds

\`embeds\` is an array of rich embeds. All keys are optional, but an embed needs at least one of title, description, fields, author, footer, image or thumbnail.

${table(["key", "type", "notes"], embedFields)}

## Components

Button styles: ${buttonStyles}.

| type | name | keys | allowed in | V2 only |
| ---: | --- | --- | --- | --- |
${componentSpecs.map((c) => `| ${c.type} | ${c.name} | ${c.keys} | ${c.where} | ${c.v2 ? "yes" : "no"} |`).join("\n")}

## Custom emoji

| where | static | animated |
| --- | --- | --- |
${emojiSyntax.map(([where, still, animated]) => `| ${where} | \`${still}\` | \`${animated}\` |`).join("\n")}

Unicode emoji on buttons and options: \`{ "name": "🎉" }\`. A wrong id shows the raw code instead of an image.

## Examples

Each example is the full payload and a ready link.

${examples}
`;
}
