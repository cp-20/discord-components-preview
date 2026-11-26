// Docs for people writing payloads: what can be written and what Discord allows, each in the form that reads fastest.
// Implementation details (link encoding, dictionary) stay in the source; link to it instead of restating it.
import type { ComponentChildren } from "preact";
import { Example } from "./Example";
import { presetById } from "./presets";
import { REPO, buttonStyles, componentSpecs, embedFields, emojiSyntax, flagRows, markdownSyntax, messageFields, modes, type Row } from "./spec";

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
  ["links", "Sharing"],
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

function Table({ head, rows, code = 0 }: { head: string[]; rows: string[][]; code?: number }) {
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
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i}>{i > 0 && i <= code ? <code>{c}</code> : c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Docs({ theme, onOpen, onInteract }: DocsProps) {
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
          <p>What you can write in a message payload and what Discord allows. Every example opens in the editor.</p>
        </header>

        <Section id="message" title="Message object" lead="The same object you send to Discord's API: create message, execute webhook, or the data of an interaction response. A bare array of components also works.">
          <KeyTable head={["key", "type", "notes"]} rows={messageFields} />
          <h3>Flags</h3>
          <KeyTable head={["value", "name", "notes"]} rows={flagRows} />
          <h3>Classic or Components V2</h3>
          <Table head={["", "Classic", "Components V2"]} rows={modes} />
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

        <Section id="emoji" title="Custom emoji" lead="Any server emoji works by its id. A wrong id shows the raw code instead of an image.">
          <Table head={["where", "static", "animated"]} rows={emojiSyntax} code={2} />
          <p class="doc-note">Unicode emoji on buttons and options: <code>{'{ "name": "🎉" }'}</code>.</p>
          {ex("emoji")}
        </Section>

        <Section id="links" title="Sharing" lead="Copy link (Ctrl+S) gives a link that holds the whole message. Nothing is saved on a server, so anyone with the link sees the same preview.">
          <p class="doc-note">
            To build links from code, follow <a href={`${REPO}/blob/main/src/share.ts`}>src/share.ts</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
