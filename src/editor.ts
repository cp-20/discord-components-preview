import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  highlightSpecialChars,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle, foldGutter, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { setDiagnostics, lintGutter, type Diagnostic } from "@codemirror/lint";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { tags } from "@lezer/highlight";
import type { Issue } from "./types";

// Colors come from CSS variables so the editor follows the app theme without reconfiguring
const highlight = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--syn-key)" },
  { tag: tags.string, color: "var(--syn-string)" },
  { tag: tags.number, color: "var(--syn-number)" },
  { tag: [tags.bool, tags.null], color: "var(--syn-keyword)" },
  { tag: [tags.brace, tags.squareBracket, tags.separator, tags.punctuation], color: "var(--syn-punct)" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px", backgroundColor: "transparent", color: "var(--text)" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "20px", overscrollBehavior: "contain" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--text)" },
  ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "var(--muted)" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 16px", minWidth: "40px" },
  ".cm-activeLine": { backgroundColor: "var(--line-active)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-2)" },
  ".cm-cursor": { borderLeftColor: "var(--text)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--selection) !important" },
  ".cm-matchingBracket": { backgroundColor: "var(--raised)", outline: "1px solid var(--hairline-strong)" },
  ".cm-selectionMatch": { backgroundColor: "var(--line-active)" },
  ".cm-foldGutter .cm-gutterElement": { color: "var(--muted)", padding: "0 4px" },
  ".cm-lintRange-error": { backgroundImage: "none", textDecoration: "underline wavy var(--negative)", textUnderlineOffset: "3px" },
  ".cm-lintRange-warning": { backgroundImage: "none", textDecoration: "underline wavy var(--warning)", textUnderlineOffset: "3px" },
  ".cm-gutter-lint": { width: "12px" },
  ".cm-gutter-lint .cm-gutterElement": { padding: "0" },
  ".cm-lint-marker": { width: "8px", height: "8px", borderRadius: "4px", content: "none", margin: "6px 0 0 4px" },
  ".cm-lint-marker-error": { backgroundColor: "var(--negative)", content: "none" },
  ".cm-lint-marker-warning": { backgroundColor: "var(--warning)", content: "none" },
  ".cm-tooltip": { backgroundColor: "var(--raised)", border: "1px solid var(--hairline-strong)", borderRadius: "8px", color: "var(--text)" },
  ".cm-tooltip-lint": { padding: "4px" },
  ".cm-diagnostic": { fontFamily: "var(--sans)", fontSize: "13px", padding: "4px 8px", borderLeft: "none" },
  ".cm-panels": { backgroundColor: "var(--surface)", color: "var(--text)", borderColor: "var(--hairline)" },
  ".cm-searchMatch": { backgroundColor: "var(--selection)" },
});

export interface EditorHandle {
  view: EditorView;
  setText(text: string): void;
  setIssues(errors: Issue[], warnings: Issue[]): void;
  reveal(offset: number, length: number): void;
}

export function createEditor(parent: HTMLElement, doc: string, onChange: (text: string) => void, extra: Extension[] = []): EditorHandle {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        foldGutter({ openText: "▾", closedText: "▸" }),
        lintGutter(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        json(),
        EditorView.lineWrapping,
        syntaxHighlighting(highlight),
        EditorState.tabSize.of(2),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
        theme,
        EditorView.contentAttributes.of({ "aria-label": "Payload JSON", spellcheck: "false" }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
        ...extra,
      ],
    }),
  });

  const clamp = (n: number) => Math.max(0, Math.min(n, view.state.doc.length));

  return {
    view,
    setText(text) {
      // Goes through a transaction so the change can be undone
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, selection: { anchor: 0 }, scrollIntoView: true });
    },
    setIssues(errors, warnings) {
      const toDiag = (severity: "error" | "warning") => (i: Issue): Diagnostic | null => {
        if (i.offset === undefined) return null;
        const from = clamp(i.offset);
        return { from, to: clamp(from + Math.max(i.length ?? 1, 1)), severity, message: i.message };
      };
      const diags = [...errors.map(toDiag("error")), ...warnings.map(toDiag("warning"))].filter((d): d is Diagnostic => d !== null);
      view.dispatch(setDiagnostics(view.state, diags));
    },
    reveal(offset, length) {
      const from = clamp(offset);
      view.dispatch({
        // Cursor at the start so the active line is the opening of the value
        selection: { anchor: clamp(from + length), head: from },
        effects: EditorView.scrollIntoView(from, { y: "center" }),
      });
      view.focus();
    },
  };
}
