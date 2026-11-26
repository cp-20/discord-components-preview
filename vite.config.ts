import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";
import { DICTIONARY } from "./src/dictionary";
import { buildLlmsTxt } from "./src/llms";
import { htmlForRoute, robotsTxt, sitemapXml } from "./src/seo";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Generates /llms.txt and /p3-dictionary.txt from the source, in dev and in the build */
function agentDocs(): Plugin {
  const files = () => {
    return { "llms.txt": buildLlmsTxt(), "p3-dictionary.txt": DICTIONARY, "robots.txt": robotsTxt(), "sitemap.xml": sitemapXml() };
  };
  return {
    name: "agent-docs",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0].slice(1) as keyof ReturnType<typeof files>;
        const body = files()[name];
        if (body === undefined) return next();
        res.setHeader("Content-Type", name.endsWith(".xml") ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8");
        res.end(body);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(files())) this.emitFile({ type: "asset", fileName, source });
    },
  };
}

/**
 * /gallery and /docs get their own copy of the built shell with route-specific title, description,
 * canonical and OG tags, so link unfurls and crawlers see the right page without running JS.
 * Workers static assets serve /gallery from gallery.html.
 */
function routeShells(): Plugin {
  return {
    name: "route-shells",
    apply: "build",
    writeBundle(options) {
      const dir = options.dir!;
      const index = readFileSync(join(dir, "index.html"), "utf8");
      for (const route of ["gallery", "docs"] as const) writeFileSync(join(dir, `${route}.html`), htmlForRoute(index, route));
    },
  };
}

export default defineConfig({
  plugins: [preact(), agentDocs(), routeShells()],
  build: { target: "es2022", assetsInlineLimit: 0 },
  test: { environment: "node" },
} as any);
