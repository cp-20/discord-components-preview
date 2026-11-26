import { useEffect, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { Example, CodeBlock } from "./Example";
import { presetById } from "./presets";
import { DICTIONARY, DICTIONARY_VERSION } from "./dictionary";
import { SITE, buttonStyles, componentSpecs, embedFields, emojiRules, flagRows, limits, markdownSyntax, messageFields, v2Rules, type Row } from "./spec";

interface DocsProps {
  theme: "dark" | "light";
  onOpen: (hash: string) => void;
  onInteract: (t: string) => void;
}

const toc: Array<[string, string]> = [
  ["message", "Message object"],
  ["content", "Content and markdown"],
  ["embeds", "Embeds"],
  ["mixed", "Content, embeds and buttons"],
  ["v2", "Components V2"],
  ["emoji", "Custom emoji"],
  ["limits", "Limits"],
  ["links", "Share links"],
];

function KeyTable({ rows, head }: { rows: Row[]; head: [string, string, string] }) {
  return (
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>
                <code>{r.key}</code>
              </td>
              <td class="mono t-type">{r.type}</td>
              <td>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, lead, children }: { id: string; title: string; lead: string; children: ComponentChildren }) {
  return (
    <section class="doc-section" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      <p class="doc-lead">{lead}</p>
      {children}
    </section>
  );
}

const python = `import base64, json, zlib, urllib.request
DICT = urllib.request.urlopen("${SITE}/p2-dictionary.txt").read()

def p2_link(payload):
    c = zlib.compressobj(9, zlib.DEFLATED, -15, zdict=DICT)  # -15 = raw deflate
    raw = c.compress(json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()) + c.flush()
    return "${SITE}/#p2=" + base64.urlsafe_b64encode(raw).decode().rstrip("=")`;

const node = `import zlib from "node:zlib";
const DICT = Buffer.from(await (await fetch("${SITE}/p2-dictionary.txt")).arrayBuffer());

const p2Link = (payload) =>
  "${SITE}/#p2=" +
  zlib.deflateRawSync(Buffer.from(JSON.stringify(payload)), { level: 9, dictionary: DICT }).toString("base64url");`;

function useSha256(text: string) {
  const [hex, setHex] = useState("");
  useEffect(() => {
    crypto.subtle
      ?.digest("SHA-256", new TextEncoder().encode(text))
      .then((buf) => setHex([...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")))
      .catch(() => {});
  }, [text]);
  return hex;
}

export function Docs({ theme, onOpen, onInteract }: DocsProps) {
  const sha = useSha256(DICTIONARY);
  const bytes = new TextEncoder().encode(DICTIONARY).length;
  const ex = (id: string) => {
    const p = presetById(id);
    return p && <Example preset={p} theme={theme} onOpen={onOpen} onInteract={onInteract} showJson />;
  };
  return (
    <div class="page docs">
      <nav class="doc-toc" aria-label="On this page">
        <span class="toc-title">On this page</span>
        {toc.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>
            {label}
          </a>
        ))}
        <a class="toc-agent" href="/llms.txt">
          /llms.txt for agents
        </a>
      </nav>

      <div class="doc-body">
        <header class="page-head">
          <h1>Docs</h1>
          <p>
            Paste a Discord message payload into the editor and it is drawn the way the client draws it, checked against Discord's rules, and shareable as a link.
            Everything runs in your browser; the payload lives in the link's fragment and never reaches a server.
          </p>
          <div class="agent-note">
            <span class="agent-note-label mono">For AI agents</span>
            <span>
              <a href="/llms.txt">/llms.txt</a> has this page as plain text: the link algorithm with the exact dictionary, every format, and each example with a ready link.
            </span>
          </div>
        </header>

        <Section id="message" title="Message object" lead="The same object you send to Discord's API: create message, execute webhook, or the data of an interaction response. A bare array of components also works.">
          <KeyTable head={["key", "type", "notes"]} rows={messageFields} />
          <h3>Flags</h3>
          <KeyTable head={["value", "name", "notes"]} rows={flagRows} />
          <h3>Classic or Components V2</h3>
          <ul class="doc-list">
            {v2Rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>

        <Section id="content" title="Content and markdown" lead="The simplest message is just content. The same markdown works in Text Displays, embed descriptions and field values.">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>syntax</th>
                  <th>result</th>
                </tr>
              </thead>
              <tbody>
                {markdownSyntax.map(([s, r]) => (
                  <tr key={s}>
                    <td>
                      <code>{s}</code>
                    </td>
                    <td>{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ex("plain")}
        </Section>

        <Section id="embeds" title="Embeds" lead="Rich embeds: a colored bar with author, title, description, fields, images and a footer. Up to 10 per message.">
          <KeyTable head={["key", "type", "notes"]} rows={embedFields} />
          {ex("embed")}
        </Section>

        <Section
          id="mixed"
          title="Content, embeds and buttons"
          lead="A classic message can combine content, several embeds and up to five Action Rows. They are drawn in that order."
        >
          {ex("content-embeds")}
        </Section>

        <Section
          id="v2"
          title="Components V2"
          lead="With flags: 32768 the components are the whole message. content and embeds are rejected, so text goes into Text Displays and cards into Containers."
        >
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>type</th>
                  <th>component</th>
                  <th>keys</th>
                  <th>allowed in</th>
                </tr>
              </thead>
              <tbody>
                {componentSpecs.map((c) => (
                  <tr key={c.type}>
                    <td class="mono num">{c.type}</td>
                    <td>
                      {c.name}
                      {c.v2 && <span class="v2-mark mono">V2</span>}
                    </td>
                    <td class="t-keys">{c.keys}</td>
                    <td>{c.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p class="doc-note">Button styles: {buttonStyles}.</p>
          {ex("showtimes")}
        </Section>

        <Section id="emoji" title="Custom emoji" lead="Server emoji load from the Discord CDN by id, in text and on buttons and select options.">
          <ul class="doc-list">
            {emojiRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {ex("emoji")}
        </Section>

        <Section id="limits" title="Limits" lead="The preview still draws a payload that breaks these, and lists each problem under it with the line to fix.">
          <dl class="limits">
            {limits.map(([what, max]) => (
              <div key={what}>
                <dt>{what}</dt>
                <dd class="num">{max}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          id="links"
          title="Share links"
          lead="A link carries the whole payload in its fragment: minified JSON, compressed with raw DEFLATE and a preset dictionary of common Discord phrases, then base64url."
        >
          <pre class="formula mono">
            {SITE}/#p2= base64url( deflate-raw( UTF-8( minified JSON ), dictionary ) )
          </pre>
          <ol class="doc-list steps">
            <li>Serialize the payload as JSON. Minified is shortest; the editor pretty-prints it on open.</li>
            <li>Encode as UTF-8.</li>
            <li>Compress with raw DEFLATE (RFC 1951, no zlib header or checksum) using the dictionary below as the preset dictionary. Level 9 gives the shortest links.</li>
            <li>Encode as base64url (RFC 4648 §5) without padding, and append it after #p2=.</li>
          </ol>
          <CodeBlock label="Python" code={python} />
          <CodeBlock label="Node.js" code={node} />
          <h3>Dictionary, version {DICTIONARY_VERSION}</h3>
          <p class="doc-note">
            The UTF-8 bytes of the text below, with no trailing newline. <span class="num">{bytes.toLocaleString("en-US")}</span> bytes
            {sha && (
              <>
                , SHA-256 <code class="sha">{sha}</code>
              </>
            )}
            . Also served as raw bytes at <a href="/p2-dictionary.txt">/p2-dictionary.txt</a>. It is frozen: a new dictionary would get a new prefix.
          </p>
          <CodeBlock label="JSON string" code={JSON.stringify(DICTIONARY)} />
        </Section>
      </div>
    </div>
  );
}
