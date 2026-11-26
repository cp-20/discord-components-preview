import { parseTree, findNodeAtLocation, printParseErrorCode, type Node, type ParseError } from "jsonc-parser";
import { ComponentType as T, IS_COMPONENTS_V2, componentNames, type Component, type Issue, type Message, type Path } from "./types";

export type Analysis =
  | { kind: "syntax"; errors: Issue[] }
  | { kind: "structure"; errors: Issue[]; warnings: Issue[] }
  | { kind: "ok"; message: Message; rootPath: Path; warnings: Issue[]; stats: Stats };

export interface Stats {
  components: number;
  textLength: number;
}

const SELECTS = new Set<number>([T.StringSelect, T.UserSelect, T.RoleSelect, T.MentionableSelect, T.ChannelSelect]);
const TOP_LEVEL = new Set<number>([T.ActionRow, T.Section, T.TextDisplay, T.MediaGallery, T.File, T.Separator, T.Container]);
const IN_CONTAINER = new Set<number>([T.ActionRow, T.Section, T.TextDisplay, T.MediaGallery, T.File, T.Separator]);

const syntaxMessages: Record<string, string> = {
  InvalidSymbol: "Unexpected character",
  InvalidNumberFormat: "Invalid number",
  PropertyNameExpected: "Expected a property name in double quotes",
  ValueExpected: "Expected a value",
  ColonExpected: "Expected ':'",
  CommaExpected: "Expected ',' between items",
  CloseBraceExpected: "Expected '}'",
  CloseBracketExpected: "Expected ']'",
  EndOfFileExpected: "Unexpected content after the end of the JSON",
  InvalidCommentToken: "Comments are not allowed in JSON",
  UnexpectedEndOfComment: "Comments are not allowed in JSON",
  UnexpectedEndOfString: "Unterminated string",
  UnexpectedEndOfNumber: "Unterminated number",
  InvalidUnicode: "Invalid unicode escape",
  InvalidEscapeCharacter: "Invalid escape character",
  InvalidCharacter: "Invalid character in string",
};

export function lineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let last = -1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      last = i;
    }
  }
  return { line, column: offset - last };
}

export function analyze(text: string): Analysis {
  if (!text.trim()) {
    return { kind: "syntax", errors: [{ message: "The payload is empty", path: [], offset: 0, length: 0, line: 1, column: 1 }] };
  }
  const parseErrors: ParseError[] = [];
  const tree = parseTree(text, parseErrors, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  // Trailing commas are not reported by parseTree in every position, so JSON.parse has the final word
  if (parseErrors.length || !tree) {
    const errors = parseErrors.slice(0, 5).map((e) => {
      const code = printParseErrorCode(e.error);
      return { message: syntaxMessages[code] ?? code, path: [], offset: e.offset, length: Math.max(e.length, 1), ...lineCol(text, e.offset) };
    });
    return { kind: "syntax", errors };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const pos = /position (\d+)/.exec(msg);
    const offset = pos ? Number(pos[1]) : 0;
    return { kind: "syntax", errors: [{ message: msg.replace(/^JSON\.parse: /, ""), path: [], offset, length: 1, ...lineCol(text, offset) }] };
  }

  const v = new Validator(tree, text);
  const message = v.root(value);
  const locate = (issues: Issue[]) => issues.map((i) => v.locate(i));
  if (v.errors.length || !message) {
    return { kind: "structure", errors: locate(v.errors), warnings: locate(v.warnings) };
  }
  return { kind: "ok", message, rootPath: Array.isArray(value) ? [] : ["components"], warnings: locate(v.warnings), stats: { components: v.count, textLength: v.textLength } };
}

const isObj = (x: unknown): x is Record<string, any> => typeof x === "object" && x !== null && !Array.isArray(x);
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
const name = (type: number) => componentNames[type] ?? `type ${type}`;

class Validator {
  errors: Issue[] = [];
  warnings: Issue[] = [];
  count = 0;
  textLength = 0;

  constructor(
    private tree: Node,
    private text: string,
  ) {}

  error(path: Path, message: string) {
    this.errors.push({ path, message });
  }
  warn(path: Path, message: string) {
    this.warnings.push({ path, message });
  }

  locate(issue: Issue): Issue {
    // Walk up the path until a node exists (a missing key points at its parent object)
    for (let n = issue.path.length; n >= 0; n--) {
      const node = findNodeAtLocation(this.tree, issue.path.slice(0, n));
      if (node) {
        const target = node.parent?.type === "property" && n === issue.path.length ? node.parent : node;
        // For large containers only highlight the first line
        const length = target.type === "object" || target.type === "array" ? 1 : target.length;
        return { ...issue, offset: target.offset, length, ...lineCol(this.text, target.offset) };
      }
    }
    return issue;
  }

  root(value: unknown): Message | null {
    let message: Message;
    if (Array.isArray(value)) {
      message = { components: value as Component[] };
      this.components(value, [], "top");
    } else if (isObj(value)) {
      if (!("components" in value)) {
        if ("type" in value) {
          this.error([], "This looks like a single component. Wrap it in a message: { \"flags\": 32768, \"components\": [ ... ] }");
        } else {
          this.error([], "Missing \"components\". Expected { \"flags\": 32768, \"components\": [ ... ] }");
        }
        return null;
      }
      if (!Array.isArray(value.components)) {
        this.error(["components"], "\"components\" must be an array");
        return null;
      }
      message = value as Message;
      if (!isInt(value.flags) || (value.flags & IS_COMPONENTS_V2) === 0) {
        this.warn(value.flags === undefined ? [] : ["flags"], "Set the IS_COMPONENTS_V2 flag (flags: 32768) or Discord will reject these components");
      }
      if (value.content) this.warn(["content"], "\"content\" can't be used with IS_COMPONENTS_V2. Use a Text Display instead");
      if (value.embeds?.length) this.warn(["embeds"], "\"embeds\" can't be used with IS_COMPONENTS_V2. Use a Container instead");
      this.components(value.components, ["components"], "top");
    } else {
      this.error([], "Expected a message object or an array of components");
      return null;
    }
    if (this.count > 40) this.warn([], `${this.count} components in total. Discord allows at most 40, nested ones included`);
    if (this.textLength > 4000) this.warn([], `${this.textLength} characters of text. Discord allows at most 4000 across all Text Displays`);
    return message;
  }

  components(list: unknown, path: Path, where: "top" | "container") {
    if (!Array.isArray(list)) {
      this.error(path, "Expected an array of components");
      return;
    }
    if (list.length === 0) this.warn(path, "Empty component list");
    list.forEach((c, i) => {
      const p = [...path, i];
      if (!this.component(c, p)) return;
      const allowed = where === "top" ? TOP_LEVEL : IN_CONTAINER;
      if (componentNames[c.type] && !allowed.has(c.type)) {
        this.warn(p, `${name(c.type)} can't be placed ${where === "top" ? "at the top level" : "inside a Container"}`);
      }
    });
  }

  /** Validates shape; returns false when the component can't be rendered at all */
  component(c: unknown, path: Path): c is Component {
    if (!isObj(c)) {
      this.error(path, "Expected a component object");
      return false;
    }
    if (!("type" in c)) {
      this.error(path, "Missing \"type\"");
      return false;
    }
    if (!isInt(c.type)) {
      this.error([...path, "type"], "\"type\" must be an integer");
      return false;
    }
    this.count++;
    return this.check(c as Component, path);
  }

  private check(c: Component, path: Path): boolean {
    switch (c.type) {
      case T.TextDisplay:
        return this.textDisplay(c, path);
      case T.Section:
        return this.section(c, path);
      case T.Container:
        return this.container(c, path);
      case T.ActionRow:
        return this.actionRow(c, path);
      case T.Button:
        return this.button(c, path);
      case T.Thumbnail:
        return this.media(c, path);
      case T.MediaGallery:
        return this.gallery(c, path);
      case T.Separator:
        return this.separator(c, path);
      case T.File:
        if (!isObj(c.file) || typeof c.file.url !== "string") {
          this.error([...path, "file"], "File needs \"file\": { \"url\": \"attachment://name.ext\" }");
          return false;
        }
        if (!c.file.url.startsWith("attachment://")) this.warn([...path, "file", "url"], "File only supports attachment:// URLs");
        return true;
      default:
        if (SELECTS.has(c.type)) return this.select(c, path);
        return true; // unknown types fall back to a raw view
    }
  }

  textDisplay(c: Component, path: Path) {
    if (typeof c.content !== "string") {
      this.error([...path, "content"], "Text Display needs a string \"content\"");
      return false;
    }
    if (!c.content.trim()) this.warn([...path, "content"], "Text Display content is empty");
    this.textLength += c.content.length;
    return true;
  }

  section(c: Component, path: Path) {
    let ok = true;
    if (!Array.isArray(c.components)) {
      this.error([...path, "components"], "Section needs \"components\": 1–3 Text Displays");
      ok = false;
    } else {
      if (c.components.length < 1 || c.components.length > 3) {
        this.warn([...path, "components"], `Section holds 1–3 Text Displays, found ${c.components.length}`);
      }
      c.components.forEach((child: unknown, i: number) => {
        const p = [...path, "components", i];
        if (!this.component(child, p)) {
          ok = false;
          return;
        }
        if (child.type !== T.TextDisplay) this.warn(p, `Section only accepts Text Displays, found ${name(child.type)}`);
      });
    }
    if (c.accessory === undefined) {
      this.error([...path], "Section needs an \"accessory\" (a Thumbnail or a Button)");
      return false;
    }
    const ap = [...path, "accessory"];
    if (!this.component(c.accessory, ap)) return false;
    if (c.accessory.type !== T.Thumbnail && c.accessory.type !== T.Button) {
      this.warn(ap, `Section accessory must be a Thumbnail or a Button, found ${name(c.accessory.type)}`);
    }
    return ok;
  }

  container(c: Component, path: Path) {
    if (!Array.isArray(c.components)) {
      this.error([...path, "components"], "Container needs a \"components\" array");
      return false;
    }
    if (c.accent_color !== undefined && c.accent_color !== null) {
      if (!isInt(c.accent_color) || c.accent_color < 0 || c.accent_color > 0xffffff) {
        this.warn([...path, "accent_color"], "accent_color is an integer from 0 to 16777215 (0xFFFFFF), e.g. 5793266 for #5865F2");
      }
    }
    const before = this.errors.length;
    this.components(c.components, [...path, "components"], "container");
    return this.errors.length === before;
  }

  actionRow(c: Component, path: Path) {
    if (!Array.isArray(c.components)) {
      this.error([...path, "components"], "Action Row needs a \"components\" array");
      return false;
    }
    let ok = true;
    let buttons = 0;
    let selects = 0;
    c.components.forEach((child: unknown, i: number) => {
      const p = [...path, "components", i];
      if (!this.component(child, p)) {
        ok = false;
        return;
      }
      if (child.type === T.Button) buttons++;
      else if (SELECTS.has(child.type)) selects++;
      else if (componentNames[child.type]) this.warn(p, `${name(child.type)} can't be placed in an Action Row`);
    });
    if (buttons > 5) this.warn([...path, "components"], `Action Row holds at most 5 buttons, found ${buttons}`);
    if (selects > 1 || (selects && buttons)) this.warn([...path, "components"], "A select menu must be alone in its Action Row");
    if (c.components.length === 0) this.warn([...path, "components"], "Action Row needs at least one component");
    return ok;
  }

  button(c: Component, path: Path) {
    if (!isInt(c.style) || c.style < 1 || c.style > 6) {
      this.error([...path, "style"], "Button needs \"style\": 1 Primary, 2 Secondary, 3 Success, 4 Danger, 5 Link or 6 Premium");
      return false;
    }
    if (c.style === 5) {
      if (typeof c.url !== "string") this.warn([...path], "Link buttons (style 5) need a \"url\"");
      if (c.custom_id !== undefined) this.warn([...path, "custom_id"], "Link buttons can't have a custom_id");
    } else if (c.style === 6) {
      if (!c.sku_id) this.warn([...path], "Premium buttons (style 6) need a \"sku_id\"");
    } else {
      if (typeof c.custom_id !== "string") this.warn([...path], "Buttons with style 1–4 need a \"custom_id\"");
      if (c.url !== undefined) this.warn([...path, "url"], "Only Link buttons (style 5) can have a url");
    }
    if (c.style !== 6 && !c.label && !c.emoji) this.warn([...path], "Button needs a \"label\" or an \"emoji\"");
    if (typeof c.label === "string" && c.label.length > 80) this.warn([...path, "label"], "Button labels are limited to 80 characters");
    return true;
  }

  media(c: Component, path: Path) {
    if (!isObj(c.media) || typeof c.media.url !== "string") {
      this.error([...path, "media"], "Thumbnail needs \"media\": { \"url\": \"https://…\" }");
      return false;
    }
    return true;
  }

  gallery(c: Component, path: Path) {
    if (!Array.isArray(c.items)) {
      this.error([...path, "items"], "Media Gallery needs an \"items\" array");
      return false;
    }
    if (c.items.length < 1 || c.items.length > 10) this.warn([...path, "items"], `Media Gallery holds 1–10 items, found ${c.items.length}`);
    let ok = true;
    c.items.forEach((item: unknown, i: number) => {
      if (!isObj(item) || !isObj(item.media) || typeof item.media.url !== "string") {
        this.error([...path, "items", i], "Each gallery item needs \"media\": { \"url\": \"https://…\" }");
        ok = false;
      }
    });
    return ok;
  }

  separator(c: Component, path: Path) {
    if (c.spacing !== undefined && c.spacing !== 1 && c.spacing !== 2) this.warn([...path, "spacing"], "spacing is 1 (small) or 2 (large)");
    if (c.divider !== undefined && typeof c.divider !== "boolean") this.warn([...path, "divider"], "divider is true or false");
    return true;
  }

  select(c: Component, path: Path) {
    if (c.type === T.StringSelect && !Array.isArray(c.options)) {
      this.warn([...path], "String Select needs an \"options\" array");
    }
    return true;
  }
}

/** Source range of the value at `path`, for jumping from the preview to the editor */
export function locatePath(text: string, path: Path): { offset: number; length: number } | null {
  const tree = parseTree(text);
  if (!tree) return null;
  const node = findNodeAtLocation(tree, path);
  return node ? { offset: node.offset, length: node.length } : null;
}
