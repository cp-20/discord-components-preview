// A small parser for the subset of markdown that Discord renders in messages.
// It produces a plain AST; the preview turns it into elements (no innerHTML anywhere).

export type Inline =
  | { t: "text"; v: string }
  | { t: "b" | "i" | "u" | "s" | "spoiler"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "mention"; kind: "user" | "role" | "channel" | "everyone" | "here" | "command"; id: string }
  | { t: "emoji"; id: string; name: string; animated: boolean }
  | { t: "time"; ts: number; style: string };

export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "h"; level: 1 | 2 | 3; c: Inline[] }
  | { t: "sub"; c: Inline[] }
  | { t: "quote"; c: Block[] }
  | { t: "list"; ordered: boolean; start: number; items: Block[][] }
  | { t: "pre"; lang: string; v: string };

// ---------- inline ----------

type Rule = { re: RegExp; make: (m: RegExpExecArray) => Inline };

const rules: Rule[] = [
  { re: /\\([^A-Za-z0-9\s])/y, make: (m) => ({ t: "text", v: m[1] }) },
  { re: /(`{1,2})([^`]|[^`][\s\S]*?[^`])\1(?!`)/y, make: (m) => ({ t: "code", v: m[2].trim() || m[2] }) },
  { re: /\|\|([\s\S]+?)\|\|/y, make: (m) => ({ t: "spoiler", c: parseInline(m[1]) }) },
  { re: /\*\*\*([\s\S]+?)\*\*\*(?!\*)/y, make: (m) => ({ t: "b", c: [{ t: "i", c: parseInline(m[1]) }] }) },
  { re: /\*\*([\s\S]+?)\*\*(?!\*)/y, make: (m) => ({ t: "b", c: parseInline(m[1]) }) },
  { re: /__([\s\S]+?)__(?!_)/y, make: (m) => ({ t: "u", c: parseInline(m[1]) }) },
  { re: /\*(?!\s)([\s\S]*?[^\s\\])\*(?!\*)/y, make: (m) => ({ t: "i", c: parseInline(m[1]) }) },
  { re: /_([\s\S]+?)_(?![A-Za-z0-9_])/y, make: (m) => ({ t: "i", c: parseInline(m[1]) }) },
  { re: /~~([\s\S]+?)~~/y, make: (m) => ({ t: "s", c: parseInline(m[1]) }) },
  { re: /\[([^\[\]\n]+)\]\(<?(https?:\/\/[^\s)>]+)>?(?:\s+"[^"]*")?\)/y, make: (m) => ({ t: "link", href: m[2], c: parseInline(m[1]) }) },
  { re: /<(https?:\/\/[^\s>]+)>/y, make: (m) => ({ t: "link", href: m[1], c: [{ t: "text", v: m[1] }] }) },
  { re: /https?:\/\/[^\s<]+[^\s<.,:;"')\]!?*_~|]/y, make: (m) => ({ t: "link", href: m[0], c: [{ t: "text", v: m[0] }] }) },
  { re: /<@!?(\d+)>/y, make: (m) => ({ t: "mention", kind: "user", id: m[1] }) },
  { re: /<@&(\d+)>/y, make: (m) => ({ t: "mention", kind: "role", id: m[1] }) },
  { re: /<#(\d+)>/y, make: (m) => ({ t: "mention", kind: "channel", id: m[1] }) },
  { re: /<\/([\w-]+(?: [\w-]+){0,2}):(\d+)>/y, make: (m) => ({ t: "mention", kind: "command", id: m[1] }) },
  { re: /@(everyone|here)\b/y, make: (m) => ({ t: "mention", kind: m[1] as "everyone" | "here", id: "" }) },
  { re: /<(a?):(\w{2,32}):(\d+)>/y, make: (m) => ({ t: "emoji", animated: m[1] === "a", name: m[2], id: m[3] }) },
  { re: /<t:(-?\d{1,13})(?::([tTdDfFR]))?>/y, make: (m) => ({ t: "time", ts: Number(m[1]), style: m[2] ?? "f" }) },
];

// Characters that can start a rule; everything else is copied as text in one go
const special = /[\\`|*_~\[<h@]/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  outer: while (i < src.length) {
    const ch = src[i];
    if (special.test(ch)) {
      // "_" only opens italics at a word boundary
      const prev = src[i - 1];
      for (const rule of rules) {
        if (ch === "_" && rule.re.source.startsWith("_(") && prev && /[A-Za-z0-9]/.test(prev)) continue;
        rule.re.lastIndex = i;
        const m = rule.re.exec(src);
        if (m) {
          // Read the end before make(): it recurses and reuses these sticky regexes
          const end = rule.re.lastIndex;
          flush();
          out.push(rule.make(m));
          i = end;
          continue outer;
        }
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

// ---------- blocks ----------

const fence = /```(?:([\w+#.-]+)\n)?\n?([\s\S]*?)```/g;

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let last = 0;
  for (const m of src.matchAll(fence)) {
    // An empty fence like `````` isn't a code block
    if (!m[2] && !m[1]) continue;
    blocks.push(...parseLines(src.slice(last, m.index).replace(/\n$/, "")));
    blocks.push({ t: "pre", lang: m[1] ?? "", v: m[2].replace(/\n$/, "") });
    last = m.index! + m[0].length;
    if (src[last] === "\n") last++;
  }
  if (last === 0 || last < src.length) blocks.push(...parseLines(src.slice(last)));
  return blocks.filter((b) => !(b.t === "p" && b.c.length === 0));
}

const heading = /^(#{1,3}) +(\S.*)$/;
const subtext = /^-# +(\S.*)$/;
const listItem = /^( *)([-*]|\d{1,9}\.) +(.*)$/;

function parseLines(src: string): Block[] {
  const lines = src.split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join("\n")) });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(">>> ")) {
      flushPara();
      blocks.push({ t: "quote", c: parseMarkdown([line.slice(4), ...lines.slice(i + 1)].join("\n")) });
      return blocks;
    }
    if (/^> /.test(line) || line === ">") {
      flushPara();
      const quoted: string[] = [];
      while (i < lines.length && (/^> /.test(lines[i]) || lines[i] === ">")) {
        quoted.push(lines[i].replace(/^> ?/, ""));
        i++;
      }
      i--;
      blocks.push({ t: "quote", c: parseLines(quoted.join("\n")) });
      continue;
    }
    let m = heading.exec(line);
    if (m) {
      flushPara();
      blocks.push({ t: "h", level: m[1].length as 1 | 2 | 3, c: parseInline(m[2]) });
      continue;
    }
    m = subtext.exec(line);
    if (m) {
      flushPara();
      blocks.push({ t: "sub", c: parseInline(m[1]) });
      continue;
    }
    if (listItem.test(line)) {
      flushPara();
      const items: Array<{ indent: number; marker: string; text: string }> = [];
      while (i < lines.length) {
        const lm = listItem.exec(lines[i]);
        if (lm) items.push({ indent: lm[1].length, marker: lm[2], text: lm[3] });
        else if (items.length && /^ {2,}\S/.test(lines[i])) items[items.length - 1].text += "\n" + lines[i].trim();
        else break;
        i++;
      }
      i--;
      blocks.push(...buildLists(items));
      continue;
    }
    para.push(line);
  }
  flushPara();
  return blocks;
}

function buildLists(items: Array<{ indent: number; marker: string; text: string }>): Block[] {
  const out: Block[] = [];
  let k = 0;
  while (k < items.length) {
    const base = items[k].indent;
    const ordered = /\d/.test(items[k].marker);
    const list: Block & { t: "list" } = { t: "list", ordered, start: ordered ? parseInt(items[k].marker, 10) : 1, items: [] };
    while (k < items.length && items[k].indent <= base + 1 && /\d/.test(items[k].marker) === ordered) {
      const body: Block[] = [{ t: "p", c: parseInline(items[k].text) }];
      k++;
      const nested: typeof items = [];
      while (k < items.length && items[k].indent > base + 1) nested.push(items[k++]);
      if (nested.length) body.push(...buildLists(nested));
      list.items.push(body);
    }
    out.push(list);
    if (k < items.length && items[k].indent < base) break;
  }
  return out;
}

// ---------- timestamps ----------

export function formatTimestamp(ts: number, style: string, now = Date.now(), locale?: string): string {
  const d = new Date(ts * 1000);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, o).format(d);
  switch (style) {
    case "t":
      return fmt({ hour: "numeric", minute: "2-digit" });
    case "T":
      return fmt({ hour: "numeric", minute: "2-digit", second: "2-digit" });
    case "d":
      return fmt({ year: "numeric", month: "2-digit", day: "2-digit" });
    case "D":
      return fmt({ year: "numeric", month: "long", day: "numeric" });
    case "F":
      return fmt({ weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
    case "R": {
      const diff = (ts * 1000 - now) / 1000;
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ["year", 31536000],
        ["month", 2592000],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
        ["second", 1],
      ];
      for (const [unit, sec] of units) {
        if (Math.abs(diff) >= sec || unit === "second") return rtf.format(Math.round(diff / sec), unit);
      }
      return "";
    }
    default:
      return fmt({ year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
}

// ---------- jumbo emoji ----------

const onlyUnicodeEmoji = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|️|‍|\s)*$/u;
const unicodeEmoji = /\p{Extended_Pictographic}|\p{Regional_Indicator}{2}/gu;

/** The client draws emoji large when a message is nothing but emoji (up to 30) */
export function isJumbo(blocks: Block[]): boolean {
  if (blocks.length !== 1 || blocks[0].t !== "p") return false;
  let count = 0;
  for (const n of blocks[0].c) {
    if (n.t === "emoji") count++;
    else if (n.t === "text" && onlyUnicodeEmoji.test(n.v)) count += n.v.match(unicodeEmoji)?.length ?? 0;
    else return false;
  }
  return count > 0 && count <= 30;
}
