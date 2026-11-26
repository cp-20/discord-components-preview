import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { analyze, locatePath } from "./validate";
import { presets, presetJson } from "./presets";
import { encodePayload, readFragment, shareUrl } from "./share";
import { useRoute, routePath, isPlainClick, type Route } from "./route";
import { Gallery } from "./Gallery";
import { Docs } from "./Docs";
import { Preview } from "./Preview";
import { createEditor, type EditorHandle } from "./editor";
import { Icon } from "./icons";
import { PAGES } from "./seo";
import type { Issue, Path } from "./types";

type Theme = "dark" | "light";
type Tab = "edit" | "preview";

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

function initialText(): string {
  return readFragment(location.hash) ?? store.get("draft") ?? presetJson(presets[0]);
}


async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function App() {
  const [text, setText] = useState(initialText);
  const [theme, setTheme] = useState<Theme>(() => (store.get("theme") === "light" ? "light" : "dark"));
  const [tab, setTab] = useState<Tab>("preview");
  const [inspect, setInspect] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const [split, setSplit] = useState(() => Number(store.get("split")) || 0.46);
  const [route, go] = useRoute();
  useEffect(() => {
    document.title = PAGES[route].title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", PAGES[route].description);
  }, [route]);
  const editorHost = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorHandle | null>(null);
  const panes = useRef<HTMLElement>(null);

  const analysis = useMemo(() => analyze(text), [text]);
  const fragment = useMemo(() => encodePayload(text), [text]);

  // Editor lives outside Preact's tree
  useEffect(() => {
    if (!editorHost.current) return;
    editor.current = createEditor(editorHost.current, text, setText);
    return () => editor.current?.view.destroy();
  }, []);

  useEffect(() => {
    if (analysis.kind === "ok") editor.current?.setIssues([], analysis.warnings);
    else editor.current?.setIssues(analysis.errors, analysis.kind === "structure" ? analysis.warnings : []);
  }, [analysis]);

  // Keep the address bar and the local draft in sync, debounced
  useEffect(() => {
    const t = setTimeout(() => {
      if (route === "editor") history.replaceState(null, "", `/#p3=${fragment}`);
      store.set("draft", text);
    }, 300);
    return () => clearTimeout(t);
  }, [fragment, route]);

  // CodeMirror measures nothing while hidden; remeasure when the editor comes back
  useEffect(() => {
    if (route === "editor") editor.current?.view.requestMeasure();
  }, [route]);

  // Links in an older format (#p=, #p2=) can't be read any more; say so instead of silently showing the draft
  useEffect(() => {
    if (/(?:^#|&)p2?=/.test(location.hash)) showToast("This link uses a retired format and can't be opened");
  }, []);

  /** Opens a #p3= hash in the editor, the same path a shared link takes */
  const openHash = useCallback(
    (hash: string) => {
      const incoming = readFragment(hash);
      go("editor", hash);
      if (incoming !== null) editor.current?.setText(incoming);
    },
    [go],
  );

  // Pasting another share link into this tab
  useEffect(() => {
    const onHash = () => {
      const incoming = readFragment(location.hash);
      if (incoming !== null && incoming !== editor.current?.view.state.doc.toString()) editor.current?.setText(incoming);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    store.set("theme", theme);
  }, [theme]);

  const showToast = useCallback((t: string) => setToast({ text: t, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const copyLink = useCallback(async () => {
    const url = shareUrl(location.href, editor.current?.view.state.doc.toString() ?? text);
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      showToast(url.length > 8000 ? `Link copied · ${url.length.toLocaleString("en-US")} characters, some apps cut links this long` : "Link copied");
    } else {
      showToast("Couldn't copy. The link is in the address bar");
    }
  }, [text]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && route === "editor") {
        e.preventDefault();
        copyLink();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [copyLink, route]);

  const format = () => {
    try {
      editor.current?.setText(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      showToast("Fix the syntax error first");
    }
  };

  const reveal = (issue: Issue) => {
    if (issue.offset === undefined) return;
    setTab("edit");
    editor.current?.reveal(issue.offset, issue.length ?? 1);
  };

  const onInspect = (path: Path) => {
    const loc = locatePath(text, path);
    if (loc) {
      setTab("edit");
      editor.current?.reveal(loc.offset, loc.length);
    }
  };

  const startDrag = (e: PointerEvent) => {
    const el = panes.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const r = Math.min(0.72, Math.max(0.28, (ev.clientX - rect.left) / rect.width));
      setSplit(r);
    };
    const up = (ev: PointerEvent) => {
      (e.target as HTMLElement).removeEventListener("pointermove", move);
      (e.target as HTMLElement).removeEventListener("pointerup", up);
      store.set("split", String((ev.clientX - rect.left) / rect.width));
    };
    (e.target as HTMLElement).addEventListener("pointermove", move);
    (e.target as HTMLElement).addEventListener("pointerup", up);
  };

  const errorCount = analysis.kind === "ok" ? 0 : analysis.errors.length;
  const warnings = analysis.kind === "syntax" ? [] : analysis.warnings;

  return (
    <div class="app" data-route={route}>
      <header class="bar">
        <div class="bar-start">
          <a
            class="brand"
            href="/"
            aria-label="Message Preview, editor"
            onClick={(e) => {
              if (!isPlainClick(e)) return;
              e.preventDefault();
              go("editor", `#p3=${fragment}`);
            }}
          >
            <svg class="brand-mark" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="1.5" y="1.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
              <rect x="5" y="5.5" width="10" height="2" rx="1" fill="currentColor" />
              <rect x="5" y="9" width="6" height="2" rx="1" fill="currentColor" opacity=".55" />
              <rect x="5" y="12.5" width="4" height="2.5" rx="1.25" fill="var(--accent)" />
            </svg>
            <span class="brand-name">
              Message Preview <span class="brand-sub">for Discord</span>
            </span>
          </a>
          <nav class="nav" aria-label="Views">
            {(["editor", "gallery", "docs"] as Route[]).map((r) => (
              <a
                key={r}
                href={routePath[r]}
                class="nav-link"
                aria-current={route === r ? "page" : undefined}
                onClick={(e) => {
                  if (!isPlainClick(e)) return;
                  e.preventDefault();
                  if (r === route) return;
                  go(r, r === "editor" ? `#p3=${fragment}` : "");
                }}
              >
                {r === "editor" ? "Editor" : r === "gallery" ? "Gallery" : "Docs"}
              </a>
            ))}
          </nav>
        </div>
        <div class="bar-actions">
          {route === "editor" && <PresetMenu onPick={(json) => editor.current?.setText(json)} />}
          <button
            class="btn ghost icon-only"
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            aria-label="Toggle theme"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <a
            class="btn ghost icon-only hide-sm"
            href="https://github.com/cp-20/discord-components-preview"
            target="_blank"
            rel="noopener noreferrer"
            title="Source on GitHub"
            aria-label="Source on GitHub"
          >
            <Icon name="github" />
          </a>
          {route === "editor" && (
            <button class="btn primary" type="button" onClick={copyLink} title="Copy a link with this payload (Ctrl+S)" aria-label="Copy link">
              <Icon name={copied ? "check" : "link"} />
              <span class="hide-sm">{copied ? "Copied" : "Copy link"}</span>
            </button>
          )}
        </div>
      </header>

      {route !== "editor" && (
        <main class="page-scroll" key={route}>
          {route === "gallery" ? (
            <Gallery theme={theme} onOpen={openHash} onInteract={(t) => showToast(`Interaction · ${t}`)} />
          ) : (
            <Docs theme={theme} onOpen={openHash} onInteract={(t) => showToast(`Interaction · ${t}`)} />
          )}
        </main>
      )}

      <div class="tabs" role="tablist" hidden={route !== "editor"}>
        <button role="tab" aria-selected={tab === "edit"} class={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>
          Editor
          {errorCount > 0 && <span class="tab-dot error" aria-label="has errors" />}
        </button>
        <button role="tab" aria-selected={tab === "preview"} class={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>
          Preview
        </button>
      </div>

      <main class="panes" ref={panes} data-tab={tab} hidden={route !== "editor"} style={{ "--split": `${split * 100}%` }}>
        <section class="pane editor-pane" aria-label="Editor">
          <div class="pane-head">
            <span class="file-name">payload.json</span>
            <div class="head-right">
              <Status analysis={analysis} />
              <button class="btn ghost small" type="button" onClick={format} title="Format JSON">
                <Icon name="braces" size={14} />
                Format
              </button>
            </div>
          </div>
          <div class="editor-host" ref={editorHost} />
          <footer class="pane-foot">
            <Icon name="lock" size={14} />
            <span class="mono">
              #p3= <span class="num">{(fragment.length + 4).toLocaleString("en-US")}</span> chars
            </span>
            <span class="foot-note">Stored in the link's fragment, which never reaches the server</span>
          </footer>
        </section>

        <div class="splitter" onPointerDown={startDrag as any} role="separator" aria-orientation="vertical" aria-label="Resize panes" />

        <section class="pane preview-pane" aria-label="Preview">
          <div class="pane-head">
            <span class="pane-title">Preview</span>
            <button
              class={`btn ghost small${inspect ? " pressed" : ""}`}
              type="button"
              aria-pressed={inspect}
              onClick={() => setInspect(!inspect)}
              title="Click a component to find it in the JSON"
            >
              <Icon name="inspect" size={14} />
              Inspect
            </button>
          </div>
          <div class={`dc theme-${theme}${inspect ? " inspecting" : ""}`}>
            {analysis.kind === "ok" ? (
              <div class="dc-scroll">
                <Preview message={analysis.message} rootPath={analysis.rootPath} inspect={inspect} onInspect={onInspect} onInteract={(t) => showToast(`Interaction · ${t}`)} />
              </div>
            ) : (
              <Problems kind={analysis.kind} errors={analysis.errors} onPick={reveal} />
            )}
          </div>
          {warnings.length > 0 && <Warnings warnings={warnings} onPick={reveal} />}
        </section>
      </main>

      {toast && (
        <div class="toast" key={toast.id} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Status({ analysis }: { analysis: ReturnType<typeof analyze> }) {
  if (analysis.kind === "syntax") {
    const e = analysis.errors[0];
    return (
      <span class="status error">
        <span class="dot" />
        Syntax error{e?.line ? ` · line ${e.line}` : ""}
      </span>
    );
  }
  if (analysis.kind === "structure") {
    return (
      <span class="status error">
        <span class="dot" />
        {analysis.errors.length} {analysis.errors.length === 1 ? "problem" : "problems"}
      </span>
    );
  }
  const { mode, components, textLength, contentLength, embedLength, embeds } = analysis.stats;
  const n = (v: number, max: number) => <span class={`num${v > max ? " over" : ""}`}>{v.toLocaleString("en-US")}</span>;
  return (
    <span class="status ok">
      <span class="dot" />
      {mode === "v2" ? (
        <>
          <span>{n(components, 40)}/40 components</span>
          <span class="sep" />
          <span class="chars">{n(textLength, 4000)}/4,000 chars</span>
        </>
      ) : (
        <>
          <span>{n(contentLength, 2000)}/2,000 content</span>
          {embeds > 0 && (
            <>
              <span class="sep" />
              <span class="chars">{n(embedLength, 6000)}/6,000 embed</span>
            </>
          )}
        </>
      )}
    </span>
  );
}

function IssueRow({ issue, onPick, kind }: { issue: Issue; onPick: (i: Issue) => void; kind: "error" | "warning" }) {
  return (
    <li>
      <button type="button" class={`issue ${kind}`} onClick={() => onPick(issue)} disabled={issue.offset === undefined}>
        <Icon name={kind === "error" ? "error" : "alert"} size={16} />
        <span class="issue-msg">{issue.message}</span>
        {issue.line !== undefined && (
          <span class="issue-loc mono">
            {issue.line}:{issue.column}
          </span>
        )}
      </button>
    </li>
  );
}

function Problems({ kind, errors, onPick }: { kind: "syntax" | "structure"; errors: Issue[]; onPick: (i: Issue) => void }) {
  return (
    <div class="problems">
      <div class="problems-card">
        <h2>{kind === "syntax" ? "This isn't valid JSON yet" : "Discord can't render this payload"}</h2>
        <p>{kind === "syntax" ? "Fix the spot below and the preview comes back." : "These parts of the payload are missing or have the wrong shape."}</p>
        <ul class="issue-list">
          {errors.map((e, i) => (
            <IssueRow key={i} issue={e} onPick={onPick} kind="error" />
          ))}
        </ul>
      </div>
    </div>
  );
}

function Warnings({ warnings, onPick }: { warnings: Issue[]; onPick: (i: Issue) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div class="warnings">
      <button type="button" class="warnings-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span class="dot warn" />
        {warnings.length} {warnings.length === 1 ? "thing" : "things"} Discord would reject
        <Icon name="chevron" size={14} class={open ? "chev open" : "chev"} />
      </button>
      {open && (
        <ul class="issue-list">
          {warnings.map((w, i) => (
            <IssueRow key={i} issue={w} onPick={onPick} kind="warning" />
          ))}
        </ul>
      )}
    </div>
  );
}

function PresetMenu({ onPick }: { onPick: (json: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("pointerdown", close);
    addEventListener("keydown", esc);
    return () => {
      removeEventListener("pointerdown", close);
      removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div class="menu" ref={ref}>
      <button class="btn ghost examples-btn" type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Examples" onClick={() => setOpen(!open)}>
        <Icon name="list" class="show-sm" />
        <span class="hide-sm">Examples</span>
        <Icon name="chevron" size={14} class="hide-sm" />
      </button>
      {open && (
        <div class="menu-pop" role="menu">
          {(["v2", "classic"] as const).map((kind) => (
            <div key={kind} class="menu-group" role="group" aria-label={kind === "v2" ? "Components V2" : "Classic messages"}>
              <span class="menu-label">{kind === "v2" ? "Components V2" : "Classic messages"}</span>
              {presets.filter((p) => p.kind === kind).map((p) => (
            <button
              key={p.id}
              role="menuitem"
              type="button"
              class="menu-item"
              onClick={() => {
                onPick(presetJson(p));
                setOpen(false);
              }}
            >
              <span class="menu-name">{p.name}</span>
              <span class="menu-note">{p.note}</span>
            </button>
          ))}
            </div>
          ))}
          <div class="menu-foot">Replaces the editor. Undo with Ctrl+Z</div>
        </div>
      )}
    </div>
  );
}
