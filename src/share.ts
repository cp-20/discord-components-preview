import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import { DICTIONARY } from "./dictionary";

/**
 * Share link format (the only one this site reads)
 *   https://discord.cp20.dev/#p2=<base64url( deflate-raw( minified UTF-8 JSON, dictionary = DICTIONARY ) )>
 * - deflate-raw: RFC 1951 stream, no zlib/gzip header, with DICTIONARY as the preset dictionary
 * - base64url: RFC 4648 §5 alphabet, no padding
 * - JSON is minified before compressing (text that isn't valid JSON is compressed as-is)
 * The fragment is never sent to the server.
 */
export const PARAM = "p2";
const dictionary = strToU8(DICTIONARY);

export function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array {
  let s = text.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Minified JSON when the text parses, otherwise the text unchanged (drafts with syntax errors still share) */
export function minify(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}

export function encodePayload(text: string): string {
  return toBase64Url(deflateSync(strToU8(minify(text)), { level: 9, dictionary }));
}

/** Decodes a `p2` value into editor text (pretty-printed when it is JSON). Null when it can't be read. */
export function decodePayload(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  let text: string;
  try {
    text = strFromU8(inflateSync(fromBase64Url(value), { dictionary }));
  } catch {
    return null;
  }
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** Reads `p2=` from a location hash such as "#p2=…" */
export function readFragment(hash: string): string | null {
  const m = /(?:^|&)p2=([^&]*)/.exec(hash.replace(/^#/, ""));
  return m && m[1] ? decodePayload(m[1]) : null;
}

export function shareHash(text: string): string {
  return `#${PARAM}=${encodePayload(text)}`;
}

export function shareUrl(base: string, text: string): string {
  return base.split("#")[0] + shareHash(text);
}
