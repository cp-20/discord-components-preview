import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";
import { createHash } from "node:crypto";
import { DICTIONARY } from "./src/dictionary";
import { buildLlmsTxt } from "./src/llms";

/** Generates /llms.txt and /p3-dictionary.txt from the source, in dev and in the build */
function agentDocs(): Plugin {
  const files = () => {
    const sha = createHash("sha256").update(DICTIONARY, "utf8").digest("hex");
    return { "llms.txt": buildLlmsTxt(sha), "p3-dictionary.txt": DICTIONARY };
  };
  return {
    name: "agent-docs",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0].slice(1) as keyof ReturnType<typeof files>;
        const body = files()[name];
        if (body === undefined) return next();
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(body);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(files())) this.emitFile({ type: "asset", fileName, source });
    },
  };
}

export default defineConfig({
  plugins: [preact(), agentDocs()],
  build: { target: "es2022", assetsInlineLimit: 0 },
  test: { environment: "node" },
} as any);
