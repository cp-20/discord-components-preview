// Classic (rich) embeds: turns the API object into what the client draws, so the renderer stays dumb
// and the layout rules can be tested without a DOM.
import type { Embed, EmbedField } from "./types";

export interface FieldCell {
  /** Index in the original `fields` array, for inspect mode */
  index: number;
  name: string;
  value: string;
  /** CSS grid-column on the client's 12-column field grid */
  column: string;
}

export interface EmbedView {
  /** Left bar color, `null` for the default (no color set) */
  color: string | null;
  author?: { name: string; url?: string; iconUrl?: string };
  title?: string;
  url?: string;
  description?: string;
  fieldRows: FieldCell[][];
  thumbnail?: string;
  image?: string;
  footer?: { text?: string; iconUrl?: string; time?: string };
}

const spans: Record<number, string[]> = {
  1: ["1 / 13"],
  2: ["1 / 7", "7 / 13"],
  3: ["1 / 5", "5 / 9", "9 / 13"],
};

/**
 * Discord packs consecutive `inline: true` fields into rows of up to 3 (2 when a thumbnail
 * takes the right side). A field without `inline` always gets a row of its own.
 */
export function layoutFields(fields: EmbedField[], hasThumbnail: boolean): FieldCell[][] {
  const perRow = hasThumbnail ? 2 : 3;
  const rows: Array<Array<{ f: EmbedField; index: number }>> = [];
  let current: Array<{ f: EmbedField; index: number }> = [];
  const close = () => {
    if (current.length) rows.push(current);
    current = [];
  };
  fields.forEach((f, index) => {
    if (!f || typeof f !== "object") return;
    if (f.inline === true) {
      if (current.length === perRow) close();
      current.push({ f, index });
    } else {
      close();
      rows.push([{ f, index }]);
    }
  });
  close();
  return rows.map((row) =>
    row.map(({ f, index }, i) => ({ index, name: String(f.name ?? ""), value: String(f.value ?? ""), column: spans[row.length][i] })),
  );
}

/** Footer timestamp like the client: "Today at 13:15", "Yesterday at 9:00", else a short date and time */
export function formatEmbedTimestamp(iso: string, now = new Date(), locale?: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(d);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `Today at ${time}`;
  if (diff === 1) return `Yesterday at ${time}`;
  return `${new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d)} ${time}`;
}

export const hexColor = (n: number) => "#" + (n & 0xffffff).toString(16).padStart(6, "0");

const str = (x: unknown) => (typeof x === "string" && x.length ? x : undefined);
const url = (x: unknown) => (typeof x === "object" && x !== null ? str((x as { url?: unknown }).url) : undefined);

export function embedView(e: Embed, now = new Date(), locale?: string): EmbedView {
  const thumbnail = url(e.thumbnail);
  const time = str(e.timestamp) ? formatEmbedTimestamp(e.timestamp!, now, locale) ?? undefined : undefined;
  const footerText = str(e.footer?.text);
  return {
    color: typeof e.color === "number" && Number.isFinite(e.color) ? hexColor(e.color) : null,
    author: str(e.author?.name) ? { name: e.author!.name, url: str(e.author!.url), iconUrl: str(e.author!.icon_url) } : undefined,
    title: str(e.title),
    url: str(e.url),
    description: str(e.description),
    fieldRows: Array.isArray(e.fields) ? layoutFields(e.fields, !!thumbnail) : [],
    thumbnail,
    image: url(e.image),
    footer: footerText || time ? { text: footerText, iconUrl: footerText ? str(e.footer?.icon_url) : undefined, time } : undefined,
  };
}

/** Characters Discord counts toward the 6000 limit shared by all embeds of a message */
export function embedTextLength(e: Embed): number {
  let n = (e.title?.length ?? 0) + (e.description?.length ?? 0) + (e.footer?.text?.length ?? 0) + (e.author?.name?.length ?? 0);
  for (const f of Array.isArray(e.fields) ? e.fields : []) n += String(f?.name ?? "").length + String(f?.value ?? "").length;
  return n;
}
