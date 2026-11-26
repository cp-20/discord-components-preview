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
      return [`### ${p.name} (${p.kind === "v2" ? "Components V2" : "Classic"})`, p.summary, "", `Link: ${shareUrl(SITE + "/", json)}`, "", "```json", json, "```"].join("\n");
    })
    .join("\n\n");

  return `# Message Preview for Discord

> ${SITE} previews a Discord message payload (content, embeds, Action Rows, and Components V2) as it renders in the Discord client, validates it against Discord API rules, and generates shareable links. It runs entirely in the browser with no server storage, account, or API key required.

Use this tool to:
- preview how a bot, webhook, or interaction response message will look before sending it
- validate a message payload against Discord API rules (errors and warnings include line and column numbers)
- look up supported fields and limits for content, embeds, and components

Pages: \`/\` live editor and preview, \`/gallery\` rendered examples, \`/docs\` payload reference.

## Sharing a payload

A share link has the form \`${SITE}/#p3=…\` and opens the payload directly in the editor.

- If one of the examples below matches what you need, share its link directly.
- Otherwise, ask the user to paste the JSON payload into ${SITE} and select **Copy link**.
- To generate share links in code, follow \`encodePayload\` in ${REPO}/blob/main/src/share.ts (using the dictionary in ${REPO}/blob/main/src/dictionary.ts).

## Message payload

The editor accepts a Discord message payload JSON object (as used by Create Message, Execute Webhook, or an interaction response's \`data\` object), or a top-level array of components.

${table(["Field", "Type", "Description"], messageFields)}

### Flags

${table(["Value", "Flag", "Description"], flagRows)}

### Classic vs. Components V2

| | Classic | Components V2 |
| --- | --- | --- |
${modes.map(([what, classic, v2]) => `| ${what} | ${classic} | ${v2} |`).join("\n")}

## Content markdown

Supported in \`content\`, Text Display components, embed descriptions, and embed field values. Embed titles and field names support inline formatting only.

${markdownSyntax.map(([syntax, what]) => `- \`${syntax}\`: ${what}`).join("\n")}

## Embeds

\`embeds\` is an array of embed objects. All fields are optional, but each embed must include at least one of \`title\`, \`description\`, \`fields\`, \`author\`, \`footer\`, \`image\`, or \`thumbnail\`.

${table(["Field", "Type", "Description"], embedFields)}

## Components

Button styles: ${buttonStyles}.

| Type | Component | Fields | Allowed in | V2 only |
| ---: | --- | --- | --- | --- |
${componentSpecs.map((c) => `| ${c.type} | ${c.name} | ${c.keys} | ${c.where} | ${c.v2 ? "yes" : "no"} |`).join("\n")}

## Custom emoji

| Location | Non-animated | Animated |
| --- | --- | --- |
${emojiSyntax.map(([where, nonAnimated, animated]) => `| ${where} | \`${nonAnimated}\` | \`${animated}\` |`).join("\n")}

Unicode emoji on buttons and select menu options use \`{ "name": "🎉" }\`. If a custom emoji ID does not exist, the preview displays the raw emoji syntax instead of an image.

## Examples

Each example includes the full JSON payload and a ready-to-open share link.

${examples}
`;
}
