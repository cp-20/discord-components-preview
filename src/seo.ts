// Per-route metadata. index.html carries the "/" tags literally (so the shell is complete without JS);
// the build copies it to gallery.html / docs.html with these values swapped in (see vite.config.ts),
// and the app sets document.title from here on client-side navigation.
import type { Route } from "./route";

export const SITE = "https://discord.cp20.dev";
export const NAME = "Message Preview for Discord";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Text of the <h1> in the static intro (read by crawlers that don't run JavaScript) */
  heading: string;
}

export const PAGES: Record<Route, PageMeta> = {
  editor: {
    path: "/",
    title: "Message Preview for Discord: embeds and Components V2 editor",
    description:
      "Write a Discord message payload (content, embeds, components, Components V2) and see it rendered like the Discord client. Share it with a link; the payload stays in the URL fragment.",
    heading: NAME,
  },
  gallery: {
    path: "/gallery",
    title: `Gallery · ${NAME}`,
    description:
      "Example Discord messages rendered like the client: plain content, embeds, Action Rows with buttons and selects, and Components V2 layouts. Open any of them in the editor.",
    heading: "Gallery",
  },
  docs: {
    path: "/docs",
    title: `Docs · ${NAME}`,
    description:
      "Which Discord message formats the preview supports, the limits and warnings it checks, and how share links (#p3=) encode a payload.",
    heading: "Docs",
  },
};

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Rewrites the "/" tags of the built index.html for another route. Throws if a tag is missing, so the build fails loudly. */
export function htmlForRoute(indexHtml: string, route: Route): string {
  const from = PAGES.editor, to = PAGES[route];
  const url = SITE + to.path;
  const swaps: [RegExp, string][] = [
    [/<title>[^<]*<\/title>/, `<title>${escapeHtml(to.title)}</title>`],
    [/(<meta name="description" content=")[^"]*/, `$1${escapeHtml(to.description)}`],
    [/(<link rel="canonical" href=")[^"]*/, `$1${url}`],
    [/(<meta property="og:url" content=")[^"]*/, `$1${url}`],
    [/(<meta property="og:title" content=")[^"]*/, `$1${escapeHtml(to.title)}`],
    [/(<meta property="og:description" content=")[^"]*/, `$1${escapeHtml(to.description)}`],
    [/(<meta name="twitter:title" content=")[^"]*/, `$1${escapeHtml(to.title)}`],
    [/(<meta name="twitter:description" content=")[^"]*/, `$1${escapeHtml(to.description)}`],
    [new RegExp(`(<div id="static-intro">\\s*<h1>)${escapeHtml(from.heading)}`), `$1${escapeHtml(to.heading)}`],
  ];
  let html = indexHtml;
  for (const [re, replacement] of swaps) {
    if (!re.test(html)) throw new Error(`index.html: no match for ${re} (needed for ${to.path})`);
    html = html.replace(re, replacement);
  }
  return html;
}

export function sitemapXml(): string {
  const urls = Object.values(PAGES)
    .map((p) => `  <url><loc>${SITE}${p.path}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    "# Docs for AI agents (link format, dictionary, every supported payload): " + SITE + "/llms.txt",
    "",
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ].join("\n");
}
