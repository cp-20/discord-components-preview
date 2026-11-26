import { presets, type PresetKind } from "./presets";
import { Example } from "./Example";

const groups: Array<{ kind: PresetKind; title: string; lead: string }> = [
  {
    kind: "v2",
    title: "Components V2",
    lead: "Requires flags: 32768 (IS_COMPONENTS_V2). Build the entire message from Containers, Sections, Media Galleries, buttons, and select menus in any order.",
  },
  {
    kind: "classic",
    title: "Classic messages",
    lead: "Combines content, up to 10 embeds, and up to 5 Action Rows. This is the standard format used by most bots and webhooks.",
  },
];

export function Gallery({ theme, onOpen, onInteract }: { theme: "dark" | "light"; onOpen: (hash: string) => void; onInteract: (t: string) => void }) {
  return (
    <div class="page">
      <header class="page-head">
        <h1>Gallery</h1>
        <p>Rendered examples of classic messages and Components V2 layouts. Open any example in the editor to customize it.</p>
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
