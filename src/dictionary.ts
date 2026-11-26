/**
 * Preset dictionary for `#p2=` share links (version 1). FROZEN: links depend on these exact bytes.
 * Changing anything here breaks every existing link; a new dictionary needs a new prefix (#p3=).
 *
 * Phrases are minified JSON as Discord payloads are usually written. Deflate references the
 * dictionary by distance from the end, so the rarest phrases come first and the most common last.
 * The dictionary is the UTF-8 encoding of the joined string. It starts with common Japanese
 * punctuation and words (3 bytes per character in UTF-8), then ASCII JSON phrases.
 */
const phrases = [
  // Japanese (rarest overall, but frequent in Japanese payloads)
  "「」（）・〜、。年月日時分曜日",
  "です。ます。ください。してください。",
  "について、こちらのお知らせ",
  "更新予定時間場所予約詳細確認設定一覧開始終了",
  // rare: webhook fields, select details, polls of keys
  '"allowed_mentions":{"parse":[]}',
  '"attachments":[]',
  '"thread_name":"',
  '"username":"',
  '"avatar_url":"https://',
  '"sku_id":"',
  '"min_values":1,"max_values":',
  '"default_values":[{"id":"',
  '"channel_types":[0]',
  '{"type":8,"custom_id":"',
  '{"type":7,"custom_id":"',
  '{"type":6,"custom_id":"',
  '{"type":5,"custom_id":"',
  '{"type":4,"custom_id":"',
  '"proxy_url":"',
  '"width":',
  '"height":',
  '"provider":{"name":"',
  '"video":{"url":"https://',
  '"type":"rich"',
  // select menus
  '{"type":1,"components":[{"type":3,"custom_id":"',
  '"placeholder":"',
  '"options":[{"label":"',
  '"},{"label":"',
  '","value":"',
  '"default":true',
  // files and media
  '{"type":13,"file":{"url":"attachment://',
  '"spoiler":true',
  '{"type":12,"items":[{"media":{"url":"https://',
  '"}},{"media":{"url":"https://',
  '"accessory":{"type":11,"media":{"url":"https://',
  '"},"description":"',
  'https://cdn.discordapp.com/attachments/',
  'https://media.discordapp.net/',
  'https://discord.cp20.dev/samples/',
  'https://github.com/',
  'https://example.com/',
  '.webp',
  '.jpg"}',
  '.png"}',
  // embeds
  '"timestamp":"2026-',
  'T00:00:00.000Z"',
  '"footer":{"text":"',
  '","icon_url":"https://',
  '"image":{"url":"https://',
  '"thumbnail":{"url":"https://',
  '"author":{"name":"',
  '","inline":true},{"name":"',
  '","inline":false}',
  '"fields":[{"name":"',
  '","value":"',
  '"color":',
  '{"content":"',
  '","embeds":[{"title":"',
  '"embeds":[{"title":"',
  '"description":"',
  // buttons
  '"emoji":{"id":"',
  '","animated":true}',
  '"emoji":{"name":"',
  '"disabled":true',
  '{"type":2,"style":4,"label":"',
  '{"type":2,"style":3,"label":"',
  '{"type":2,"style":2,"label":"',
  '{"type":1,"components":[{"type":2,"style":1,"label":"',
  '","custom_id":"',
  '"accessory":{"type":2,"style":5,"label":"',
  '","url":"https://',
  // markdown and mentions
  '<t:1',
  ':R>',
  '<@&',
  '<#',
  '<a:',
  '<:',
  '](https://',
  '\\n- ',
  '\\n\\n',
  // components v2
  '{"type":14,"divider":false,"spacing":2}',
  '{"type":14,"divider":true,"spacing":2}',
  '{"type":14,"divider":true,"spacing":1}',
  '{"type":14}',
  '{"flags":32768,"components":[{"type":17,"accent_color":',
  ',"components":[{"type":10,"content":"## ',
  '{"type":10,"content":"-# ',
  '\\n-# ',
  '{"type":9,"components":[{"type":10,"content":"**',
  '**\\n',
  '"}]},',
  '"},{"type":10,"content":"',
];

export const DICTIONARY_VERSION = 1;
export const DICTIONARY = phrases.join("");
