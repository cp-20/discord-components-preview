import { SITE } from "./spec";
export { SITE };
const img = (name: string) => `${SITE}/samples/${name}.png`;

export type PresetKind = "v2" | "classic";

export interface Preset {
  id: string;
  kind: PresetKind;
  name: string;
  /** Short list of what it uses, for the Examples menu */
  note: string;
  /** One line for the gallery: what this format can do */
  summary: string;
  payload: unknown;
}

// Custom emoji from public servers, checked against the CDN. "missing" is a made-up id that returns 404.
const E = {
  check: "<:check:921544057312915498>",
  cross: "<:cross:833101993668771842>",
  node: "<:node:1270522693078225077>",
  dice: "<:dice:755891608091885627>",
  siren: "<a:siren:1049837871772729354>",
  catvibe: "<a:catvibe:654099753340239872>",
  missing: "<:missing:111111111111111111>",
};

const showtimes = {
  flags: 32768,
  components: [
    {
      type: 17,
      accent_color: 0xe0795f,
      components: [
        {
          type: 10,
          content: "### 星降る港の物語\n12月4日 (金) の上映時間です",
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 9,
          components: [{ type: 10, content: "**サンプルシネマ渋谷**\n13:00〜15:30 ・ 19:00〜21:30" }],
          accessory: { type: 2, style: 5, label: "予約", url: "https://example.com/cinema/shibuya" },
        },
        { type: 14, divider: true, spacing: 2 },
        { type: 10, content: "-# 少し離れた劇場" },
        {
          type: 9,
          components: [{ type: 10, content: "**サンプルシネマ横浜**\n11:00〜13:30 ・ 17:00〜19:30" }],
          accessory: { type: 2, style: 5, label: "予約", url: "https://example.com/cinema/yokohama" },
        },
        {
          type: 9,
          components: [{ type: 10, content: "**みなとシアター (大宮)**\n10:30〜13:00 ほか" }],
          accessory: { type: 2, style: 5, label: "予約", url: "https://example.com/theater/omiya" },
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            "-# サンプルシネマ新宿は改装のため休館中です。上映時間は変更になる場合があるため、予約前に各劇場の公式サイトでご確認ください。",
        },
      ],
    },
  ],
};

const simple = {
  flags: 32768,
  components: [
    {
      type: 17,
      accent_color: 0x3d7a6f,
      components: [
        {
          type: 10,
          content:
            "## Release 2.4.0\nScheduled reminders now respect your server's time zone, and `/remind list` shows the next run for each reminder.\n\n- Fixed duplicate reminders after a restart\n- `/remind edit` keeps the original channel\n- Up to **25** reminders per member (was 10)\n\n-# Shipped <t:1795651200:R> · [Changelog](https://example.com/changelog)",
        },
      ],
    },
  ],
};

const sections = {
  flags: 32768,
  components: [
    { type: 10, content: "# Now playing in #listening-room" },
    {
      type: 17,
      components: [
        {
          type: 9,
          components: [
            { type: 10, content: "**Lights Down Low**\nMaya Hoshino · *Night Shift*" },
            { type: 10, content: "-# 2:41 / 4:05 · queued by <@123456789012345678>" },
          ],
          accessory: { type: 11, media: { url: img("record") }, description: "Album art" },
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 9,
          components: [{ type: 10, content: "**Up next**\nTwo more tracks in the queue" }],
          accessory: { type: 2, style: 2, label: "Show queue", custom_id: "queue:show" },
        },
        {
          type: 9,
          components: [{ type: 10, content: "**Autoplay**\nKeep the room going when the queue ends" }],
          accessory: { type: 2, style: 3, label: "On", custom_id: "autoplay:toggle", emoji: { name: "🔁" } },
        },
      ],
    },
  ],
};

const actionRows = {
  flags: 32768,
  components: [
    { type: 10, content: "**Deploy `api@4f2c9e1` to production?**\nThe canary has been healthy for 30 minutes." },
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "Deploy", custom_id: "deploy:go", emoji: { name: "🚀" } },
        { type: 2, style: 1, label: "Deploy to canary only", custom_id: "deploy:canary" },
        { type: 2, style: 4, label: "Cancel", custom_id: "deploy:cancel" },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 2, label: "Diff", custom_id: "deploy:diff" },
        { type: 2, style: 2, label: "Rollback", custom_id: "deploy:rollback", disabled: true },
        { type: 2, style: 5, label: "Open dashboard", url: "https://example.com/deploys/1931" },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: "deploy:region",
          placeholder: "Choose regions",
          options: [
            { label: "Tokyo", value: "nrt" },
            { label: "Frankfurt", value: "fra" },
          ],
        },
      ],
    },
  ],
};

const gallery = {
  flags: 32768,
  components: [
    {
      type: 17,
      components: [
        { type: 10, content: "## Weekend trip\nPhotos from Saturday, all shot on the 35mm." },
        {
          type: 12,
          items: [
            { media: { url: img("ridge") }, description: "Ridge at sunset" },
            { media: { url: img("lake") }, description: "Lake" },
            { media: { url: img("forest") } },
            { media: { url: img("city") }, spoiler: true },
          ],
        },
        { type: 14, spacing: 2, divider: false },
        { type: 13, file: { url: "attachment://route.gpx" } },
        { type: 10, content: "-# The last one is hidden behind a spoiler" },
      ],
    },
    { type: 99, note: "Unknown types are shown raw so you can debug them" },
  ],
};

const plain = {
  content:
    "## Weekly sync moves to Thursday\nThe sync is now **Thursday 15:00** in <#1100000000000000001>, starting <t:1795824000:D>.\n\n- Agenda is in the [shared doc](https://example.com/agenda)\n- Bring your Q4 numbers, ~~slides~~ not needed\n- Run `/standup skip` if you can't make it\n\n> Reply in the thread if the new time doesn't work for you\n-# Sent by the scheduler for <@&1100000000000000002>",
};

const richEmbed = {
  embeds: [
    {
      author: { name: "Film club", icon_url: img("avatar"), url: "https://example.com/film-club" },
      title: "Friday film night: Night Shift",
      url: "https://example.com/film-club/night-shift",
      description:
        "A late-night radio host keeps a city awake through one long storm. We'll watch the **director's cut** and talk after.\n\nRSVP with the button in <#1100000000000000003>.",
      color: 0xe0795f,
      fields: [
        { name: "When", value: "Fri <t:1795860000:t>", inline: true },
        { name: "Where", value: "Room 4B", inline: true },
        { name: "Seats", value: "18 / 24", inline: true },
        { name: "Bring", value: "Snacks are covered. Bring a cushion if you like the floor seats." },
      ],
      thumbnail: { url: img("poster") },
      image: { url: img("city") },
      footer: { text: "Film club · 3rd screening this season", icon_url: img("record") },
      timestamp: "2026-12-04T09:00:00.000Z",
    },
  ],
};

const contentAndEmbeds = {
  content: "<@&1100000000000000004> `main` failed on the nightly build",
  embeds: [
    {
      title: "Build #1931 failed",
      url: "https://example.com/ci/1931",
      color: 0xda373c,
      description: "`test/share.test.ts` · 2 of 48 tests failed after `4f2c9e1`",
      fields: [
        { name: "Branch", value: "`main`", inline: true },
        { name: "Duration", value: "3m 12s", inline: true },
        { name: "Author", value: "<@123456789012345678>", inline: true },
      ],
      footer: { text: "CI · nightly" },
      timestamp: "2026-12-04T03:12:00.000Z",
    },
    {
      title: "Last green build",
      url: "https://example.com/ci/1930",
      color: 0x248046,
      description: "#1930 · `9b1d0aa` · passed in 3m 04s",
    },
  ],
  components: [
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: "Open run", url: "https://example.com/ci/1931" },
        { type: 2, style: 2, label: "Re-run", custom_id: "ci:rerun:1931" },
        { type: 2, style: 4, label: "Revert 4f2c9e1", custom_id: "ci:revert:4f2c9e1" },
      ],
    },
  ],
};

const emoji = {
  content: `${E.check} Deploy finished ${E.siren}\nRuntime ${E.node} 24.2 · rolled ${E.dice} on the canary · ${E.missing} is not on the CDN, so it shows as code`,
  embeds: [
    {
      title: `${E.catvibe} Release vibes`,
      color: 0x3d7a6f,
      description: `Custom emoji work in embed text too ${E.check}`,
      fields: [
        { name: `${E.check} Passed`, value: "46", inline: true },
        { name: `${E.cross} Failed`, value: "0", inline: true },
      ],
    },
  ],
  components: [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "Ship it", custom_id: "release:ship", emoji: { id: "921544057312915498", name: "check" } },
        { type: 2, style: 2, label: "Party", custom_id: "release:party", emoji: { id: "654099753340239872", name: "catvibe", animated: true } },
        { type: 2, style: 2, label: "Unknown id", custom_id: "release:missing", emoji: { id: "111111111111111111", name: "missing" } },
        { type: 2, style: 2, label: "Unicode", custom_id: "release:unicode", emoji: { name: "🎉" } },
      ],
    },
  ],
};

const selects = {
  flags: 32768,
  components: [
    {
      type: 17,
      accent_color: 0x5865f2,
      components: [
        { type: 10, content: "### Notification settings\nPick what this channel should post. Click a menu to see its options." },
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: "notify:events",
              placeholder: "Choose events",
              min_values: 1,
              max_values: 3,
              options: [
                { label: "Deploys", value: "deploy", description: "Every production deploy", emoji: { id: "1270522693078225077", name: "node" }, default: true },
                { label: "Incidents", value: "incident", description: "Paging alerts only", emoji: { id: "1049837871772729354", name: "siren", animated: true }, default: true },
                { label: "Releases", value: "release", description: "Tagged versions", emoji: { name: "📦" } },
              ],
            },
          ],
        },
        { type: 1, components: [{ type: 5, custom_id: "notify:owner", placeholder: "Who gets pinged" }] },
        { type: 1, components: [{ type: 8, custom_id: "notify:channel", placeholder: "Post to another channel", disabled: true }] },
      ],
    },
  ],
};

export const presets: Preset[] = [
  {
    id: "showtimes",
    kind: "v2",
    name: "Movie showtimes",
    note: "Container, Sections with Link buttons, Separators, subtext",
    summary: "A card of theaters and times, each row with its own booking link",
    payload: showtimes,
  },
  {
    id: "simple",
    kind: "v2",
    name: "Container and text",
    note: "Accent color and Discord markdown",
    summary: "Release notes in a Container with an accent bar, lists and a relative time",
    payload: simple,
  },
  {
    id: "sections",
    kind: "v2",
    name: "Sections",
    note: "Thumbnail and Button accessories",
    summary: "Text with a thumbnail or a button beside it, like a now-playing card",
    payload: sections,
  },
  {
    id: "actions",
    kind: "v2",
    name: "Action rows",
    note: "Every button style, disabled, emoji, select",
    summary: "All six button styles, a disabled button and a select in Action Rows",
    payload: actionRows,
  },
  {
    id: "selects",
    kind: "v2",
    name: "Select menus",
    note: "String select with options, user and channel selects",
    summary: "Menus you can open: options with emoji, descriptions and defaults",
    payload: selects,
  },
  {
    id: "gallery",
    kind: "v2",
    name: "Media gallery",
    note: "Gallery, File, spoiler, unknown type",
    summary: "Photo grid with a spoiler, an attachment card and a raw unknown type",
    payload: gallery,
  },
  {
    id: "plain",
    kind: "classic",
    name: "Plain message",
    note: "content with headings, lists, quotes, mentions",
    summary: "Just content: Discord markdown with mentions, a timestamp and a quote",
    payload: plain,
  },
  {
    id: "embed",
    kind: "classic",
    name: "Rich embed",
    note: "Author, fields, thumbnail, image, footer, timestamp",
    summary: "Every embed part: author, linked title, inline fields, images and footer",
    payload: richEmbed,
  },
  {
    id: "content-embeds",
    kind: "classic",
    name: "Content, embeds and buttons",
    note: "content + 2 embeds + an Action Row",
    summary: "A CI alert: a role ping, two colored embeds and buttons underneath",
    payload: contentAndEmbeds,
  },
  {
    id: "emoji",
    kind: "classic",
    name: "Custom emoji",
    note: "<:name:id>, animated, button emoji, missing id",
    summary: "Custom and animated emoji in text, embeds and buttons, with a broken id",
    payload: emoji,
  },
];

export const presetById = (id: string) => presets.find((p) => p.id === id);

export const presetJson = (p: Preset) => JSON.stringify(p.payload, null, 2);
