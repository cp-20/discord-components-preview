import { presets, type PresetKind } from "./presets";
import { Example } from "./Example";

const groups: Array<{ kind: PresetKind; title: string; lead: string }> = [
  {
    kind: "v2",
    title: "Components V2",
    lead: "flags: 32768. The components are the whole message: Containers, Sections, galleries, buttons and menus in any order.",
  },
  {
    kind: "classic",
    title: "Classic messages",
    lead: "content, embeds and up to five Action Rows. What most bots and webhooks still send.",
  },
];

export function Gallery({ theme, onOpen, onInteract }: { theme: "dark" | "light"; onOpen: (hash: string) => void; onInteract: (t: string) => void }) {
  return (
    <div class="page">
      <header class="page-head">
        <h1>Gallery</h1>
        <p>What each message format can do, drawn the way Discord draws it. Open any example in the editor to change it.</p>
      </header>
      {groups.map((g) => (
        <section key={g.kind} class="page-section" aria-labelledby={`g-${g.kind}`}>
          <div class="section-head">
            <h2 id={`g-${g.kind}`}>{g.title}</h2>
            <p>{g.lead}</p>
          </div>
          <div class="example-grid">
            {presets
              .filter((p) => p.kind === g.kind)
              .map((p) => (
                <Example key={p.id} preset={p} theme={theme} onOpen={onOpen} onInteract={onInteract} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
