// Custom Discord emoji: `<:name:id>` / `<a:name:id>` in text, `{ id, name, animated }` on buttons and select options.

export interface CustomEmoji {
  id: string;
  name: string;
  animated: boolean;
}

/** Same rule as the markdown parser: name 2–32 word characters, id a snowflake (digits) */
export const EMOJI_RE = /<(a?):(\w{2,32}):(\d{1,20})>/;

export function parseEmojiCode(code: string): CustomEmoji | null {
  const m = new RegExp(`^${EMOJI_RE.source}$`).exec(code.trim());
  return m ? { animated: m[1] === "a", name: m[2], id: m[3] } : null;
}

/** All custom emoji codes in a string, in order */
export function findEmojiCodes(text: string): CustomEmoji[] {
  return [...text.matchAll(new RegExp(EMOJI_RE.source, "g"))].map((m) => ({ animated: m[1] === "a", name: m[2], id: m[3] }));
}

export function emojiCode(e: CustomEmoji): string {
  return `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`;
}

/** Discord CDN: .webp for still emoji, .gif for animated ones */
export function emojiUrl(e: Pick<CustomEmoji, "id" | "animated">, size = 48): string {
  return `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "webp"}?size=${size}`;
}

/** Normalizes a component `emoji` object. Unicode emoji have only a name; custom ones have an id. */
export function emojiFromObject(o: unknown): { unicode: string } | CustomEmoji | null {
  if (!o || typeof o !== "object") return null;
  const { id, name, animated } = o as { id?: unknown; name?: unknown; animated?: unknown };
  if (id !== undefined && id !== null && /^\d{1,20}$/.test(String(id))) {
    return { id: String(id), name: typeof name === "string" && name ? name : "emoji", animated: animated === true };
  }
  if (typeof name === "string" && name) return { unicode: name };
  return null;
}
