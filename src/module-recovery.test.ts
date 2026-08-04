import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("Cloudflare asset routing", () => {
  test("keeps missing bundles out of the SPA fallback", () => {
    const redirects = readFileSync(
      new URL("../public/_redirects", import.meta.url),
      "utf8"
    );
    const assetNotFoundPage = readFileSync(
      new URL("../public/assets/404.html", import.meta.url),
      "utf8"
    );

    expect(redirects).not.toMatch(/^\s*\/\*\s+\/index\.html\s+200\s*$/m);
    expect(assetNotFoundPage).toContain("<title>Asset not found</title>");
  });
});

describe("module recovery bootstrap", () => {
  test("retries a failed module with a cache-busting URL", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const recoveryScript = html.match(
      /<script id="module-recovery">([\s\S]*?)<\/script>/
    )?.[1];

    expect(recoveryScript).toBeDefined();

    const appendedScripts: Array<{
      onerror?: () => void;
      onload?: () => void;
      src?: string;
      type?: string;
    }> = [];
    const storage = new Map<string, string>();
    let moduleErrorListener:
      | ((event: { target?: unknown }) => void)
      | undefined;
    const windowObject: {
      __recoverEftBossModule?: (script: {
        remove: () => void;
        src: string;
      }) => void;
      addEventListener: (
        type: string,
        listener: (event: { target?: unknown }) => void,
        capture: boolean
      ) => void;
    } = {
      addEventListener: (type, listener, capture) => {
        if (type === "error" && capture) {
          moduleErrorListener = listener;
        }
      },
    };
    const documentObject = {
      createElement: () => ({}),
      head: {
        appendChild: (script: (typeof appendedScripts)[number]) => {
          appendedScripts.push(script);
        },
      },
    };
    const locationObject = {
      href: "https://eftboss.com/pvp",
      replace: () => undefined,
    };
    const historyObject = {
      replaceState: () => undefined,
    };
    const sessionStorageObject = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    };
    const immediateTimeout = (callback: () => void) => {
      callback();
      return 0;
    };

    new Function(
      "window",
      "document",
      "location",
      "history",
      "sessionStorage",
      "setTimeout",
      recoveryScript!
    )(
      windowObject,
      documentObject,
      locationObject,
      historyObject,
      sessionStorageObject,
      immediateTimeout
    );

    let removed = false;
    moduleErrorListener?.({
      target: {
        tagName: "SCRIPT",
        type: "module",
        remove: () => {
          removed = true;
        },
        src: "https://eftboss.com/assets/index-stale.js",
      },
    });

    expect(windowObject.__recoverEftBossModule).toBeDefined();
    expect(moduleErrorListener).toBeDefined();
    expect(removed).toBe(true);
    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0].type).toBe("module");
    expect(appendedScripts[0].src).toContain(
      "https://eftboss.com/assets/index-stale.js?__asset_retry="
    );
  });

  test("ignores failures from unrelated modules after the app has loaded", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const recoveryScript = html.match(
      /<script id="module-recovery">([\s\S]*?)<\/script>/
    )?.[1];
    let moduleErrorListener:
      | ((event: { target?: unknown }) => void)
      | undefined;
    const appendedScripts: unknown[] = [];
    const replacedUrls: unknown[] = [];
    let removed = false;
    const windowObject: {
      __recoverEftBossModule?: (script: {
        remove: () => void;
        src: string;
      }) => void;
      addEventListener: (
        type: string,
        listener: (event: { target?: unknown }) => void,
        capture: boolean
      ) => void;
    } = {
      addEventListener: (type, listener, capture) => {
        if (type === "error" && capture) moduleErrorListener = listener;
      },
    };

    new Function(
      "window",
      "document",
      "location",
      "history",
      "sessionStorage",
      "setTimeout",
      recoveryScript!
    )(
      windowObject,
      {
        createElement: () => ({}),
        head: { appendChild: (script: unknown) => appendedScripts.push(script) },
      },
      {
        href: "https://eftboss.com/pve?map=Woods",
        replace: (url: unknown) => replacedUrls.push(url),
      },
      { replaceState: () => undefined },
      { getItem: () => null, setItem: () => undefined },
      (callback: () => void) => {
        callback();
        return 0;
      }
    );

    moduleErrorListener?.({
      target: {
        tagName: "SCRIPT",
        type: "module",
        remove: () => {
          removed = true;
        },
        src: "https://eftboss.com/assets/vendor-stale.js",
      },
    });

    expect(removed).toBe(false);
    expect(appendedScripts).toHaveLength(0);
    expect(replacedUrls).toHaveLength(0);
  });

  test("cleans an asset reload marker without navigating", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const recoveryScript = html.match(
      /<script id="module-recovery">([\s\S]*?)<\/script>/
    )?.[1];
    const historyUrls: string[] = [];
    const navigatedUrls: unknown[] = [];

    new Function(
      "window",
      "document",
      "location",
      "history",
      "sessionStorage",
      "setTimeout",
      recoveryScript!
    )(
      { addEventListener: () => undefined },
      { createElement: () => ({}), head: { appendChild: () => undefined } },
      {
        href: "https://eftboss.com/pve?__asset_reload=123&map=Woods",
        replace: (url: unknown) => navigatedUrls.push(url),
      },
      {
        replaceState: (_state: unknown, _title: string, url: URL) =>
          historyUrls.push(url.href),
      },
      { getItem: () => null, setItem: () => undefined },
      () => 0
    );

    expect(historyUrls).toEqual(["https://eftboss.com/pve?map=Woods"]);
    expect(navigatedUrls).toHaveLength(0);
  });

  test("ignores errors from non-module resources", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const recoveryScript = html.match(
      /<script id="module-recovery">([\s\S]*?)<\/script>/
    )?.[1];
    let moduleErrorListener:
      | ((event: { target?: unknown }) => void)
      | undefined;
    const appendedScripts: unknown[] = [];
    const windowObject: {
      __recoverEftBossModule?: (script: {
        remove: () => void;
        src: string;
      }) => void;
      addEventListener: (
        type: string,
        listener: (event: { target?: unknown }) => void,
        capture: boolean
      ) => void;
    } = {
      addEventListener: (type, listener, capture) => {
        if (type === "error" && capture) moduleErrorListener = listener;
      },
    };

    new Function(
      "window",
      "document",
      "location",
      "history",
      "sessionStorage",
      "setTimeout",
      recoveryScript!
    )(
      windowObject,
      {
        createElement: () => ({}),
        head: { appendChild: (script: unknown) => appendedScripts.push(script) },
      },
      { href: "https://eftboss.com/pvp", replace: () => undefined },
      { replaceState: () => undefined },
      { getItem: () => null, setItem: () => undefined },
      (callback: () => void) => {
        callback();
        return 0;
      }
    );

    moduleErrorListener?.({
      target: {
        tagName: "IMG",
        type: "",
        remove: () => undefined,
        src: "https://eftboss.com/missing.webp",
      },
    });

    expect(appendedScripts).toHaveLength(0);
  });
});
