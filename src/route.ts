import { useEffect, useState } from "preact/hooks";

export type Route = "editor" | "gallery" | "docs";

export const routePath: Record<Route, string> = { editor: "/", gallery: "/gallery", docs: "/docs" };

export function routeFromPath(path: string): Route {
  if (/^\/gallery\/?$/.test(path)) return "gallery";
  if (/^\/docs\/?$/.test(path)) return "docs";
  return "editor";
}

/** Client-side routing on real paths (/gallery, /docs); the fragment stays free for the payload */
export function useRoute(): [Route, (to: Route, hash?: string) => void] {
  const [route, setRoute] = useState<Route>(() => routeFromPath(location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(location.pathname));
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const go = (to: Route, hash = "") => {
    history.pushState(null, "", routePath[to] + hash);
    setRoute(to);
    scrollTo(0, 0);
  };
  return [route, go];
}

/** Lets a plain left click on an internal link navigate in place; modified clicks open a new tab as usual */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
