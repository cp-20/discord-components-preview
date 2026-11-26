// What the tool understands, as data. /llms.txt and the Docs view are both generated from this,
// so the two never disagree.

export const SITE = "https://discord.cp20.dev";
export const REPO = "https://github.com/cp-20/discord-components-preview";

export interface Row {
  key: string;
  type: string;
  notes: string;
}

export const messageFields: Row[] = [
  { key: "content", type: "string", notes: "Message text with Discord markdown, up to 2,000 characters. Not allowed with IS_COMPONENTS_V2." },
  { key: "embeds", type: "Embed[]", notes: "Up to 10 embeds, with at most 6,000 characters combined across all embeds. Not allowed with IS_COMPONENTS_V2." },
  { key: "components", type: "Component[]", notes: "Up to 5 Action Rows in classic messages, or up to 40 components total with IS_COMPONENTS_V2." },
  { key: "flags", type: "integer", notes: "Bitfield of message flags (see Flags below). Set 32768 to enable Components V2." },
  { key: "username", type: "string", notes: "Webhook username override. Shown as the message author in the preview." },
  { key: "avatar_url", type: "string", notes: "Webhook avatar URL override. Shown as the author avatar in the preview." },
];

export const flagRows: Row[] = [
  { key: "4", type: "SUPPRESS_EMBEDS", notes: "Hides embeds in the message." },
  { key: "64", type: "EPHEMERAL", notes: "For interaction responses only. Adds the “Only you can see this” notice in the preview." },
  { key: "4096", type: "SUPPRESS_NOTIFICATIONS", notes: "Sends the message without push or desktop notifications. No visual change in the preview." },
  { key: "32768", type: "IS_COMPONENTS_V2", notes: "Enables Components V2. The message is built entirely from components; content and embeds are not allowed." },
];

export const embedFields: Row[] = [
  { key: "title", type: "string ≤256", notes: "Embed title with inline markdown and custom emoji. Rendered as a link when url is set." },
  { key: "url", type: "string", notes: "HTTP or HTTPS URL that turns the title into a link." },
  { key: "description", type: "string ≤4096", notes: "Main embed text. Supports full Discord markdown, mentions, and custom emoji." },
  { key: "color", type: "integer 0–16777215", notes: "Left border color as an RGB integer (for example, 14711135 for #E0795F). Defaults to a neutral border." },
  { key: "author", type: "{ name ≤256, url?, icon_url? }", notes: "Author header above the title, with an optional link and 24px circular icon." },
  { key: "fields", type: "{ name ≤256, value ≤1024, inline? }[] ≤25", notes: "Key-value fields. Setting inline: true arranges fields up to 3 per row (2 next to a thumbnail)." },
  { key: "thumbnail", type: "{ url }", notes: "80×80 thumbnail image in the top-right corner." },
  { key: "image", type: "{ url }", notes: "Main embed image displayed below fields, up to 400×300." },
  { key: "footer", type: "{ text ≤2048, icon_url? }", notes: "Small footer text at the bottom, with an optional 20px circular icon." },
  { key: "timestamp", type: "ISO 8601 string", notes: "Timestamp displayed in the footer (for example, “Today at 9:30” or a formatted date)." },
];

export interface ComponentSpec {
  type: number;
  name: string;
  keys: string;
  where: string;
  v2: boolean;
}

export const componentSpecs: ComponentSpec[] = [
  { type: 1, name: "Action Row", keys: "components (up to 5 Buttons, or 1 select menu)", where: "Top level, Container", v2: false },
  { type: 2, name: "Button", keys: "style (1–6), label (≤80), emoji, custom_id (styles 1–4), url (style 5), sku_id (style 6), disabled", where: "Action Row, Section accessory", v2: false },
  { type: 3, name: "String Select", keys: "custom_id, options[{label, value, description?, emoji?, default?}], placeholder, min_values, max_values, disabled", where: "Action Row", v2: false },
  { type: 5, name: "User Select", keys: "custom_id, placeholder, disabled", where: "Action Row", v2: false },
  { type: 6, name: "Role Select", keys: "custom_id, placeholder, disabled", where: "Action Row", v2: false },
  { type: 7, name: "Mentionable Select", keys: "custom_id, placeholder, disabled", where: "Action Row", v2: false },
  { type: 8, name: "Channel Select", keys: "custom_id, placeholder, channel_types, disabled", where: "Action Row", v2: false },
  { type: 9, name: "Section", keys: "components (1–3 Text Displays), accessory (Thumbnail or Button)", where: "Top level, Container", v2: true },
  { type: 10, name: "Text Display", keys: "content (markdown)", where: "Top level, Container, Section", v2: true },
  { type: 11, name: "Thumbnail", keys: "media: {url}, description, spoiler", where: "Section accessory", v2: true },
  { type: 12, name: "Media Gallery", keys: "items (1–10 items: {media: {url}, description?, spoiler?})", where: "Top level, Container", v2: true },
  { type: 13, name: "File", keys: "file: {url: \"attachment://name.ext\"}, spoiler", where: "Top level, Container", v2: true },
  { type: 14, name: "Separator", keys: "divider (default true), spacing (1 small, 2 large)", where: "Top level, Container", v2: true },
  { type: 17, name: "Container", keys: "components, accent_color (0–16777215), spoiler", where: "Top level", v2: true },
];

export const buttonStyles = "1 Primary (blurple), 2 Secondary (gray), 3 Success (green), 4 Danger (red), 5 Link (requires url; no custom_id), 6 Premium (requires sku_id)";

export const markdownSyntax: Array<[string, string]> = [
  ["# / ## / ###", "Headings (at the start of a line)"],
  ["-# text", "Subtext (small muted text)"],
  ["**bold** *italic* _italic_ __underline__ ~~strike~~", "Inline formatting (can be nested)"],
  ["||spoiler||", "Spoiler text (hidden until clicked)"],
  ["`code` and ```lang fenced```", "Inline code and fenced code blocks"],
  ["> quote and >>> rest of message", "Single-line and multi-line block quotes"],
  ["- item, * item, 1. item", "Bulleted and numbered lists (indent with 2 spaces to nest)"],
  ["[label](https://…), <https://…>, bare https://…", "Masked links and plain URLs"],
  ["<@id> <@&id> <#id> </name:id> @everyone @here", "User, role, channel, and slash command mentions"],
  ["<t:unix:t|T|d|D|f|F|R>", "Timestamps formatted in the viewer's time zone (R shows relative time)"],
  ["<:name:id> <a:name:id>", "Custom emoji (a: for animated)"],
];




/** Classic vs Components V2, side by side: [aspect, classic, V2] */
export const modes: Array<[string, string, string]> = [
  ["Flags", "None", "32768 (IS_COMPONENTS_V2)"],
  ["Fields", "content, up to 10 embeds, and up to 5 Action Rows", "components only"],
  ["Layout", "Fixed order: content, embeds, then Action Rows", "Containers, Sections, Text Displays, Media Galleries, Separators, Files, and Action Rows in any order"],
  ["Limits", "2,000 characters in content; 6,000 characters across all embeds", "40 components total; 4,000 characters across all Text Displays"],
];

/** Custom emoji syntax: [location, non-animated, animated] */
export const emojiSyntax: Array<[string, string, string]> = [
  ["Message and embed text", "<:name:id>", "<a:name:id>"],
  ["Buttons and select menu options", '{ "id": "…", "name": "…" }', '{ "id": "…", "name": "…", "animated": true }'],
];
