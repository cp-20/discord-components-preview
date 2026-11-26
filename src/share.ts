import { deflateSync, inflateSync, unzlibSync, strToU8, strFromU8 } from "fflate";

/**
 * URL fragment format
 *   #p=<base64url( deflate-raw( UTF-8 JSON ) )>
 * Fallbacks accepted when reading:
 *   - zlib-wrapped deflate (e.g. Python `zlib.compress`)
 *   - plain base64 / base64url of the UTF-8 JSON, no compression
 * The fragment is never sent to the server.
 */

export function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array {
  let s = text.trim().replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodePayload(json: string): string {
  return toBase64Url(deflateSync(strToU8(json), { level: 9 }));
}

const looksLikeJson = (s: string) => /^\s*[[{]/.test(s);

/** Decodes a `p` value. Returns the JSON text, or null when nothing readable is found. */
export function decodePayload(value: string): string | null {
  let raw = value;
  try {
    raw = decodeURIComponent(value);
  } catch {
    /* keep as-is */
  }
  if (looksLikeJson(raw)) return raw; // someone pasted raw JSON into the fragment
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(raw);
  } catch {
    return null;
  }
  const attempts: Array<() => Uint8Array> = [
    () => inflateSync(bytes),
    () => unzlibSync(bytes),
    () => bytes,
  ];
  for (const attempt of attempts) {
    try {
      const text = strFromU8(attempt());
      if (looksLikeJson(text)) {
        JSON.parse(text); // must at least be valid JSON to accept a fallback guess
        return text;
      }
    } catch {
      /* try next */
    }
  }
  // Last resort: decoded bytes look like JSON but don't parse; still hand them to the editor
  try {
    const text = strFromU8(bytes);
    if (looksLikeJson(text)) return text;
  } catch {
    /* ignore */
  }
  return null;
}

export function readFragment(hash: string): string | null {
  // Parsed by hand: URLSearchParams would turn "+" from plain base64 into spaces
  const m = /(?:^|&)p=([^&]*)/.exec(hash.replace(/^#/, ""));
  return m && m[1] ? decodePayload(m[1]) : null;
}

export function shareUrl(base: string, json: string): string {
  return `${base.split("#")[0]}#p=${encodePayload(json)}`;
}
