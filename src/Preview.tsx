import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { formatTimestamp, parseMarkdown, type Block, type Inline } from "./markdown";
import { ComponentType as T, componentNames, type Component, type Message, type Path } from "./types";
import { Icon } from "./icons";
import { SITE } from "./presets";

export interface PreviewProps {
  message: Message;
  rootPath: Path;
  inspect: boolean;
  onInspect: (path: Path) => void;
  onInteract: (text: string) => void;
}

/** Serve our own sample images from the current origin so local dev and previews work offline */
export function mediaSrc(url: string): string {
  if (typeof location !== "undefined" && url.startsWith(SITE + "/")) return url.slice(SITE.length);
  return url;
}

const hex = (n: number) => "#" + n.toString(16).padStart(6, "0");

export function Preview({ message, rootPath: root, inspect, onInspect, onInteract }: PreviewProps) {
  const now = new Date();
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now);
  const ctx: Ctx = { inspect, onInspect, onInteract };
  return (
    <div class="dc-msg">
      <img class="dc-avatar" src={mediaSrc(message.avatar_url || `${SITE}/samples/avatar.png`)} alt="" width={40} height={40} />
      <div class="dc-body">
        <div class="dc-header">
          <span class="dc-name">{message.username || "Preview Bot"}</span>
          <span class="dc-tag">APP</span>
          <time class="dc-time">Today at {time}</time>
        </div>
        <div class="dc-stack">{message.components.map((c, i) => renderComponent(c, [...root, i], ctx))}</div>
      </div>
    </div>
  );
}

interface Ctx {
  inspect: boolean;
  onInspect: (path: Path) => void;
  onInteract: (text: string) => void;
}

/** Wraps a component so it can be picked in inspect mode */
function Pick({ ctx, path, type, children, class: cls }: { ctx: Ctx; path: Path; type: number; children: ComponentChildren; class?: string }) {
  if (!ctx.inspect) return <>{children}</>;
  return (
    <div
      class={`dc-pick ${cls ?? ""}`}
      data-label={`${componentNames[type] ?? "Unknown"} · ${type}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.onInspect(path);
      }}
    >
      {children}
    </div>
  );
}

function renderComponent(c: Component, path: Path, ctx: Ctx): ComponentChildren {
  const key = path.join(".");
  const body = (() => {
    switch (c.type) {
      case T.TextDisplay:
        return <TextDisplay content={c.content} />;
      case T.Container:
        return (
          <div
            class={`dc-container${c.accent_color != null ? " has-accent" : ""}${c.spoiler ? " is-spoiler" : ""}`}
            style={c.accent_color != null ? { "--accent": hex(Number(c.accent_color) & 0xffffff) } : undefined}
          >
            {c.components.map((child: Component, i: number) => renderComponent(child, [...path, "components", i], ctx))}
          </div>
        );
      case T.Section:
        return (
          <div class={`dc-section accessory-${c.accessory?.type === T.Thumbnail ? "thumb" : "button"}`}>
            <div class="dc-section-text">
              {(c.components ?? []).map((child: Component, i: number) => renderComponent(child, [...path, "components", i], ctx))}
            </div>
            <div class="dc-section-accessory">{renderComponent(c.accessory, [...path, "accessory"], ctx)}</div>
          </div>
        );
      case T.Thumbnail:
        return <Media url={c.media.url} alt={c.description} spoiler={c.spoiler} class="dc-thumb" />;
      case T.MediaGallery:
        return <Gallery items={c.items} />;
      case T.Separator:
        return <div class={`dc-sep spacing-${c.spacing === 2 ? 2 : 1}${c.divider === false ? "" : " divider"}`} role="separator" />;
      case T.ActionRow:
        return (
          <div class="dc-row">
            {c.components.map((child: Component, i: number) => renderComponent(child, [...path, "components", i], ctx))}
          </div>
        );
      case T.Button:
        return <Button c={c} ctx={ctx} />;
      case T.StringSelect:
      case T.UserSelect:
      case T.RoleSelect:
      case T.MentionableSelect:
      case T.ChannelSelect:
        return <Select c={c} />;
      case T.File:
        return <FileCard url={c.file.url} spoiler={c.spoiler} />;
      default:
        return <Unknown c={c} />;
    }
  })();
  return (
    <Pick key={key} ctx={ctx} path={path} type={c.type}>
      {body}
    </Pick>
  );
}

// ---------- Text Display ----------

export function TextDisplay({ content }: { content: string }) {
  return <div class="dc-md">{parseMarkdown(content).map((b, i) => renderBlock(b, i))}</div>;
}

function renderBlock(b: Block, key: number): ComponentChildren {
  switch (b.t) {
    case "p":
      return <p key={key}>{renderInline(b.c)}</p>;
    case "h": {
      const H = `h${b.level}` as "h1";
      return <H key={key}>{renderInline(b.c)}</H>;
    }
    case "sub":
      return (
        <small key={key} class="dc-sub">
          {renderInline(b.c)}
        </small>
      );
    case "quote":
      return (
        <blockquote key={key}>
          <div>{b.c.map(renderBlock)}</div>
        </blockquote>
      );
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return (
        <L key={key} start={b.ordered ? b.start : undefined}>
          {b.items.map((item, i) => (
            <li key={i}>{item.map(renderBlock)}</li>
          ))}
        </L>
      );
    }
    case "pre":
      return (
        <pre key={key}>
          <code>{b.v}</code>
        </pre>
      );
  }
}

function renderInline(nodes: Inline[]): ComponentChildren {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "b":
        return <strong key={i}>{renderInline(n.c)}</strong>;
      case "i":
        return <em key={i}>{renderInline(n.c)}</em>;
      case "u":
        return <u key={i}>{renderInline(n.c)}</u>;
      case "s":
        return <s key={i}>{renderInline(n.c)}</s>;
      case "spoiler":
        return <Spoiler key={i}>{renderInline(n.c)}</Spoiler>;
      case "code":
        return <code key={i}>{n.v}</code>;
      case "link":
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">
            {renderInline(n.c)}
          </a>
        );
      case "mention": {
        const label =
          n.kind === "user" ? "@user" : n.kind === "role" ? "@role" : n.kind === "channel" ? "#channel" : n.kind === "command" ? `/${n.id}` : `@${n.kind}`;
        return (
          <span key={i} class="dc-mention" title={n.id ? `${n.kind} ${n.id}` : undefined}>
            {label}
          </span>
        );
      }
      case "emoji":
        return (
          <img
            key={i}
            class="dc-emoji"
            src={`https://cdn.discordapp.com/emojis/${n.id}.${n.animated ? "gif" : "webp"}?size=48`}
            alt={`:${n.name}:`}
            title={`:${n.name}:`}
            draggable={false}
          />
        );
      case "time":
        return (
          <span key={i} class="dc-time-inline" title={new Date(n.ts * 1000).toString()}>
            {formatTimestamp(n.ts, n.style)}
          </span>
        );
    }
  });
}

function Spoiler({ children }: { children: ComponentChildren }) {
  const [open, setOpen] = useState(false);
  return (
    <span class={`dc-spoiler${open ? " open" : ""}`} onClick={() => setOpen(true)} role="button" tabIndex={0}>
      <span>{children}</span>
    </span>
  );
}

// ---------- media ----------

function Media({ url, alt, spoiler, class: cls }: { url: string; alt?: string; spoiler?: boolean; class: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const hidden = spoiler && !revealed;
  return (
    <div class={`${cls} dc-media${hidden ? " is-hidden" : ""}`} onClick={() => setRevealed(true)}>
      {failed === url || !/^(https?:|attachment:|\/)/.test(url) ? (
        <div class="dc-media-broken" title={url}>
          <Icon name="image" size={20} />
          <span>{url.startsWith("attachment://") ? url.slice(13) : "Can't load"}</span>
        </div>
      ) : (
        <img src={mediaSrc(url)} alt={alt ?? ""} loading="lazy" onError={() => setFailed(url)} />
      )}
      {hidden && <span class="dc-spoiler-pill">SPOILER</span>}
    </div>
  );
}

function Gallery({ items }: { items: Array<{ media: { url: string }; description?: string; spoiler?: boolean }> }) {
  const shown = items.slice(0, 10);
  return (
    <div class={`dc-gallery n${shown.length}`}>
      {shown.map((item, i) => (
        <Media key={i} url={item.media.url} alt={item.description} spoiler={item.spoiler} class={`dc-gallery-item i${i}`} />
      ))}
    </div>
  );
}

function FileCard({ url, spoiler }: { url: string; spoiler?: boolean }) {
  const name = url.replace(/^attachment:\/\//, "").split("/").pop() || "file";
  return (
    <div class={`dc-file${spoiler ? " is-spoiler" : ""}`}>
      <Icon name="file" size={28} class="dc-file-icon" />
      <div class="dc-file-meta">
        <span class="dc-file-name">{name}</span>
        <span class="dc-file-size">Attachment</span>
      </div>
      <Icon name="download" size={20} class="dc-file-dl" />
    </div>
  );
}

// ---------- interactive ----------

const styleNames: Record<number, string> = { 1: "primary", 2: "secondary", 3: "success", 4: "danger", 5: "link", 6: "premium" };

function ButtonEmoji({ emoji }: { emoji: Component["emoji"] }) {
  if (!emoji) return null;
  if (emoji.id)
    return (
      <img
        class="dc-btn-emoji"
        src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "webp"}?size=44`}
        alt={emoji.name ?? ""}
      />
    );
  return <span class="dc-btn-emoji">{emoji.name}</span>;
}

function Button({ c, ctx }: { c: Component; ctx: Ctx }) {
  const style = styleNames[c.style] ?? "secondary";
  const content = (
    <>
      <ButtonEmoji emoji={c.emoji} />
      {c.style === 6 && !c.label ? <span>Premium</span> : c.label && <span class="dc-btn-label">{c.label}</span>}
      {c.style === 5 && <Icon name="external" size={16} class="dc-btn-ext" />}
    </>
  );
  const cls = `dc-btn ${style}${c.disabled ? " disabled" : ""}`;
  if (c.style === 5 && !c.disabled && typeof c.url === "string" && /^https?:\/\//.test(c.url)) {
    return (
      <a class={cls} href={c.url} target="_blank" rel="noopener noreferrer" title={c.url}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      class={cls}
      disabled={c.disabled}
      onClick={() => ctx.onInteract(c.style === 6 ? `sku_id ${c.sku_id ?? "—"}` : `custom_id ${c.custom_id ?? "—"}`)}
    >
      {content}
    </button>
  );
}

const selectPlaceholder: Record<number, string> = {
  3: "Make a selection",
  5: "Select a user",
  6: "Select a role",
  7: "Select a user or role",
  8: "Select a channel",
};

function Select({ c }: { c: Component }) {
  return (
    <div class={`dc-select${c.disabled ? " disabled" : ""}`}>
      <span>{c.placeholder ?? selectPlaceholder[c.type]}</span>
      <Icon name="chevronSelect" size={20} />
    </div>
  );
}

function Unknown({ c }: { c: Component }) {
  const label = componentNames[c.type];
  return (
    <div class="dc-unknown">
      <div class="dc-unknown-head">
        <Icon name="alert" size={14} />
        <span>
          {label ? `${label} isn't shown in messages` : "Unknown component"} · <b>type {c.type}</b>
        </span>
      </div>
      <pre>{JSON.stringify(c, null, 2)}</pre>
    </div>
  );
}
