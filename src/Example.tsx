import { useState } from "preact/hooks";
import { analyze } from "./validate";
import { Preview } from "./Preview";
import { Icon } from "./icons";
import { shareHash } from "./share";
import { isPlainClick } from "./route";
import { presetJson, type Preset } from "./presets";

export interface ExampleProps {
  preset: Preset;
  theme: "dark" | "light";
  /** Opens the payload in the editor; receives the link hash so the editor reads it like a shared link */
  onOpen: (hash: string) => void;
  onInteract: (text: string) => void;
  showJson?: boolean;
}

/** A rendered preset with its one-line summary and a link into the editor */
export function Example({ preset, theme, onOpen, onInteract, showJson }: ExampleProps) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const json = presetJson(preset);
  const analysis = analyze(json);
  const hash = shareHash(json);
  return (
    <article class="example">
      <div class={`example-stage dc theme-${theme}`}>
        {analysis.kind === "ok" && <Preview message={analysis.message} rootPath={analysis.rootPath} inspect={false} onInspect={() => {}} onInteract={onInteract} />}
      </div>
      <div class="example-meta">
        <div class="example-text">
          <h3 class="example-name">{preset.name}</h3>
          <p class="example-summary">{preset.summary}</p>
        </div>
        <div class="example-actions">
          {showJson && (
            <button type="button" class="btn ghost small" aria-expanded={jsonOpen} onClick={() => setJsonOpen(!jsonOpen)}>
              <Icon name="braces" size={14} />
              JSON
            </button>
          )}
          <a
            class="btn secondary small"
            href={"/" + hash}
            onClick={(e) => {
              if (!isPlainClick(e)) return;
              e.preventDefault();
              onOpen(hash);
            }}
          >
            Open in editor
            <Icon name="arrowRight" size={14} />
          </a>
        </div>
      </div>
      {jsonOpen && <CodeBlock code={json} label="payload.json" />}
    </article>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div class="code">
      <div class="code-head">
        <span class="mono">{label}</span>
        <button
          type="button"
          class="btn ghost small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              /* clipboard blocked */
            }
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre class="mono">{code}</pre>
    </div>
  );
}
