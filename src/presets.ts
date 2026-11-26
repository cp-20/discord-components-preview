export const SITE = "https://discord.cp20.dev";
const img = (name: string) => `${SITE}/samples/${name}.png`;

export interface Preset {
  id: string;
  name: string;
  note: string;
  payload: unknown;
}

const showtimes = {
  flags: 32768,
  components: [
    {
      type: 17,
      accent_color: 0xe0795f,
      components: [
        {
          type: 10,
          content: "### タコピーの原罪 ありがとう、また明日\n11月27日 (金) の上映時間です",
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 9,
          components: [{ type: 10, content: "**ヒューマントラストシネマ渋谷**\n13:15〜15:55 ・ 20:05〜22:45" }],
          accessory: { type: 2, style: 5, label: "予約", url: "https://ttcg.jp/human_shibuya/" },
        },
        { type: 14, divider: true, spacing: 2 },
        { type: 10, content: "-# 少し離れた劇場" },
        {
          type: 9,
          components: [{ type: 10, content: "**シネマシティ (立川)**\n11:30〜14:09 ・ 17:25〜20:04" }],
          accessory: { type: 2, style: 5, label: "予約", url: "https://cinemacity.co.jp/" },
        },
        {
          type: 9,
          components: [{ type: 10, content: "**チネチッタ (川崎)**\n10:30〜13:10 ほか" }],
          accessory: { type: 2, style: 5, label: "予約", url: "https://cinecitta.co.jp/" },
        },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 10,
          content:
            "-# 109シネマズ二子玉川は改修工事のため休館中です。上映時間は変更になる場合があるため、予約前に各劇場の公式サイトでご確認ください。",
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

export const presets: Preset[] = [
  { id: "showtimes", name: "Movie showtimes", note: "Container, Sections with Link buttons, Separators, subtext", payload: showtimes },
  { id: "simple", name: "Container and text", note: "Accent color and Discord markdown", payload: simple },
  { id: "sections", name: "Sections", note: "Thumbnail and Button accessories", payload: sections },
  { id: "actions", name: "Action rows", note: "Every button style, disabled, emoji, select", payload: actionRows },
  { id: "gallery", name: "Media gallery", note: "Gallery, File, spoiler, unknown type", payload: gallery },
];

export const presetJson = (p: Preset) => JSON.stringify(p.payload, null, 2);
