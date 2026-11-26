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
  ["message", "Message payload"],
  ["content", "Content and markdown"],
  ["embeds", "Embeds"],
  ["mixed", "Content, embeds, and buttons"],
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
          /llms.txt for AI agents
        </a>
      </nav>

      <div class="doc-body">
        <header class="page-head">
          <h1>Docs</h1>
          <p>Reference for supported Discord message payload fields, limits, and components. Every example can be opened in the editor.</p>
        </header>

        <Section id="message" title="Message payload" lead="Accepts the same JSON object sent to the Discord API for Create Message, Execute Webhook, or an interaction response's data object. You can also paste a top-level array of components.">
          <KeyTable head={["Field", "Type", "Description"]} rows={messageFields} />
          <h3>Flags</h3>
          <KeyTable head={["Value", "Flag", "Description"]} rows={flagRows} />
          <h3>Classic vs. Components V2</h3>
          <Table head={["", "Classic", "Components V2"]} rows={modes} />
        </Section>

        <Section id="content" title="Content and markdown" lead="A basic message only needs a content field. The same Discord markdown syntax works in Text Display components, embed descriptions, and embed field values.">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Syntax</th>
                  <th>Result</th>
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

        <Section id="embeds" title="Embeds" lead="Structured cards with a colored left border, author, title, description, fields, images, and a footer. A message can include up to 10 embeds.">
          <KeyTable head={["Field", "Type", "Description"]} rows={embedFields} />
          {ex("embed")}
        </Section>

        <Section
          id="mixed"
          title="Content, embeds, and buttons"
          lead="A classic message can combine content, up to 10 embeds, and up to 5 Action Rows. Discord displays them in that order."
        >
          {ex("content-embeds")}
        </Section>

        <Section
          id="v2"
          title="Components V2"
          lead="When flags includes 32768 (IS_COMPONENTS_V2), the message is built entirely from components. Top-level content and embeds are not allowed; use Text Display for text and Container for grouped cards."
        >
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Component</th>
                  <th>Fields</th>
                  <th>Allowed in</th>
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

        <Section id="emoji" title="Custom emoji" lead="Use any custom emoji by its ID. If the ID does not exist, the preview displays the raw emoji syntax instead of an image.">
          <Table head={["Location", "Non-animated", "Animated"]} rows={emojiSyntax} code={2} />
          <p class="doc-note">Unicode emoji on buttons and select menu options: <code>{'{ "name": "🎉" }'}</code>.</p>
          {ex("emoji")}
        </Section>

        <Section id="links" title="Sharing" lead="Copy link (Ctrl+S) creates a URL that contains the entire payload. Nothing is stored on a server, and anyone with the link sees the same preview.">
          <p class="doc-note">
            To generate share links programmatically, see <a href={`${REPO}/blob/main/src/share.ts`}>src/share.ts</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
