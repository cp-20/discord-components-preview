// What the tool understands, as data. /llms.txt and the Docs view are both generated from this,
// so the two never disagree.

export const SITE = "https://discord.cp20.dev";

export interface Row {
  key: string;
  type: string;
  notes: string;
}

export const messageFields: Row[] = [
  { key: "content", type: "string", notes: "Message text with Discord markdown, up to 2000 characters. Not allowed with IS_COMPONENTS_V2" },
  { key: "embeds", type: "Embed[]", notes: "Up to 10 rich embeds, 6000 characters across all of them. Not allowed with IS_COMPONENTS_V2" },
  { key: "components", type: "Component[]", notes: "Classic: up to 5 Action Rows. With IS_COMPONENTS_V2: any layout components, up to 40 in total" },
  { key: "flags", type: "integer", notes: "Bit field, see Flags. 32768 switches the message to Components V2" },
  { key: "username", type: "string", notes: "Webhook name override, shown as the author in the preview" },
  { key: "avatar_url", type: "string", notes: "Webhook avatar override, shown in the preview" },
];

export const flagRows: Row[] = [
  { key: "4", type: "SUPPRESS_EMBEDS", notes: "Embeds are hidden" },
  { key: "64", type: "EPHEMERAL", notes: "Interaction replies only. The preview adds the “Only you can see this” line" },
  { key: "4096", type: "SUPPRESS_NOTIFICATIONS", notes: "Sends silently. No visual change" },
  { key: "32768", type: "IS_COMPONENTS_V2", notes: "Components become the whole message. content and embeds are rejected" },
];

export const embedFields: Row[] = [
  { key: "title", type: "string ≤256", notes: "Bold, inline markdown and custom emoji. A link when url is set" },
  { key: "url", type: "string", notes: "http(s) link for the title" },
  { key: "description", type: "string ≤4096", notes: "Full markdown: headings, lists, quotes, code, mentions, emoji" },
  { key: "color", type: "integer 0–16777215", notes: "Left bar color, e.g. 14711135 for #E0795F. Default is a neutral bar" },
  { key: "author", type: "{ name ≤256, url?, icon_url? }", notes: "Small line above the title with a round 24px icon" },
  { key: "fields", type: "{ name ≤256, value ≤1024, inline? }[] ≤25", notes: "inline: true fields share a row, 3 per row or 2 next to a thumbnail" },
  { key: "thumbnail", type: "{ url }", notes: "80×80 image in the top right" },
  { key: "image", type: "{ url }", notes: "Large image under the fields, up to 400×300" },
  { key: "footer", type: "{ text ≤2048, icon_url? }", notes: "Small muted line with a round 20px icon" },
  { key: "timestamp", type: "ISO 8601 string", notes: "Shown in the footer as “Today at 13:15”, “Yesterday at …” or a date" },
];

export interface ComponentSpec {
  type: number;
  name: string;
  keys: string;
  where: string;
  v2: boolean;
}

export const componentSpecs: ComponentSpec[] = [
  { type: 1, name: "Action Row", keys: "components: up to 5 Buttons, or 1 select menu", where: "Top level, Container", v2: false },
  { type: 2, name: "Button", keys: "style 1–6, label, emoji, custom_id (1–4), url (5), sku_id (6), disabled", where: "Action Row, Section accessory", v2: false },
  { type: 3, name: "String Select", keys: "custom_id, options[{label, value, description?, emoji?, default?}], placeholder, min_values, max_values, disabled", where: "Action Row", v2: false },
  { type: 5, name: "User Select", keys: "custom_id, placeholder, disabled", where: "Action Row", v2: false },
  { type: 6, name: "Role Select", keys: "custom_id, placeholder, disabled", where: "Action Row", v2: false },
  { type: 7, name: "Mentionable Select", keys: "custom_id, placeholder, disabled", where: "Action Row", v2: false },
  { type: 8, name: "Channel Select", keys: "custom_id, placeholder, channel_types, disabled", where: "Action Row", v2: false },
  { type: 9, name: "Section", keys: "components: 1–3 Text Displays, accessory: Thumbnail or Button", where: "Top level, Container", v2: true },
  { type: 10, name: "Text Display", keys: "content (markdown)", where: "Top level, Container, Section", v2: true },
  { type: 11, name: "Thumbnail", keys: "media: {url}, description, spoiler", where: "Section accessory", v2: true },
  { type: 12, name: "Media Gallery", keys: "items: 1–10 of {media: {url}, description?, spoiler?}", where: "Top level, Container", v2: true },
  { type: 13, name: "File", keys: "file: {url: \"attachment://name.ext\"}, spoiler", where: "Top level, Container", v2: true },
  { type: 14, name: "Separator", keys: "divider (default true), spacing 1 small / 2 large", where: "Top level, Container", v2: true },
  { type: 17, name: "Container", keys: "components, accent_color (0–16777215), spoiler", where: "Top level", v2: true },
];

export const buttonStyles = "1 Primary (blurple), 2 Secondary (grey), 3 Success (green), 4 Danger (red), 5 Link (needs url, no custom_id), 6 Premium (needs sku_id)";

export const markdownSyntax: Array<[string, string]> = [
  ["# / ## / ###", "Headings, at the start of a line"],
  ["-# text", "Subtext, small and muted"],
  ["**bold** *italic* _italic_ __underline__ ~~strike~~", "Inline styles, nestable"],
  ["||spoiler||", "Hidden until clicked"],
  ["`code` and ```lang fenced```", "Inline code and code blocks"],
  ["> quote and >>> rest of message", "Block quotes"],
  ["- item, * item, 1. item", "Lists, nested with two spaces"],
  ["[label](https://…), <https://…>, bare https://…", "Links"],
  ["<@id> <@&id> <#id> </name:id> @everyone @here", "User, role, channel and command mentions"],
  ["<t:unix:t|T|d|D|f|F|R>", "Timestamps in the viewer's time zone, R is relative"],
  ["<:name:id> <a:name:id>", "Custom emoji from the Discord CDN, a: for animated"],
];

export const limits: Array<[string, string]> = [
  ["content", "2000 characters"],
  ["embeds", "10 per message, 6000 characters in total"],
  ["embed title / description", "256 / 4096"],
  ["embed fields", "25, name 256, value 1024"],
  ["classic components", "5 Action Rows, 5 buttons or 1 select each"],
  ["Components V2", "40 components (nested included), 4000 characters across Text Displays"],
  ["button label", "80 characters"],
  ["Media Gallery", "1–10 items"],
];

export const v2Rules = [
  "Without flags: 32768 a message is classic: content, embeds and up to 5 Action Rows of buttons or a select.",
  "With flags: 32768 (IS_COMPONENTS_V2) the components are the whole message. content and embeds are rejected by Discord; the preview warns and does not draw them.",
  "Using a V2 component (Container, Section, Text Display, …) without the flag is rejected too; the preview warns.",
  "A bare array of components is accepted as a shortcut for { \"components\": [...] }.",
];

export const emojiRules = [
  "In text (content, Text Display, embed title, description, field name and value): <:name:id> for a still emoji, <a:name:id> for an animated one.",
  "On buttons and select options: \"emoji\": { \"id\": \"…\", \"name\": \"…\", \"animated\": true } for custom, { \"name\": \"🎉\" } for unicode.",
  "Images load from https://cdn.discordapp.com/emojis/<id>.webp (animated: .gif). The name doesn't matter for the image.",
  "If the CDN has no such emoji (404), the raw code is shown as a grey chip so you can spot the wrong id.",
  "A message whose content is only emoji (up to 30) shows them large, like the client.",
];
