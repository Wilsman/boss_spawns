import { execSync } from "node:child_process";
import type { Plugin } from "vite";

// Build-time changelog: every (non-merge) commit is a release, versioned from its message.
//   MAJOR_MILESTONES commit, or "feat!:" / "BREAKING CHANGE" -> major bump
//   feat / add / redesign / phase                             -> minor bump
//   anything else                                              -> patch bump
// Exposed to the app as `virtual:changelog` (newest release first).

// Add this site's milestone commit hashes here to start a named major version.
const MAJOR_MILESTONES: Record<string, string> = {};

// Pure noise commits left out of the log (they still count toward nothing).
const SKIP = [/eslint ?cache/i, /^Auto-commit before/i];

export interface ChangelogEntry {
  version: string;
  hash: string;
  date: string;
  kind: string;
  scope: string | null;
  title: string;
  body: string[];
  milestone: string | null;
  files: number;
  insertions: number;
  deletions: number;
}

const MINOR_WORDS = /^(add|implement|introduce|redesign|phase \d|expand|integrate)/i;

function classify(subject: string) {
  const m = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  if (m) return { kind: m[1].toLowerCase(), scope: m[2] ?? null, breaking: !!m[3], title: m[4] };
  const kind = MINOR_WORDS.test(subject) ? "feat" : /\bfix/i.test(subject) ? "fix" : /\bperf\b/i.test(subject) ? "perf" : "change";
  return { kind, scope: null, breaking: false, title: subject };
}

function readChangelog(root: string): ChangelogEntry[] {
  let raw: string;
  try {
    raw = execSync(
      'git log --reverse --no-merges --shortstat --format="%x1e%h%x1f%aI%x1f%s%x1f%b%x1f"',
      { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch {
    console.warn("[changelog] Git history is unavailable; the footer version tag will be hidden.");
    return [];
  }

  let [major, minor, patch] = [0, 0, 0];
  const out: ChangelogEntry[] = [];
  for (const record of raw.split("\x1e")) {
    if (!record.trim()) continue;
    const [hash, date, subject, bodyRaw = "", stat = ""] = record.split("\x1f");
    if (SKIP.some((re) => re.test(subject))) continue;

    const { kind, scope, breaking, title } = classify(subject.trim());
    const milestone = MAJOR_MILESTONES[hash] ?? null;
    if (milestone || breaking || /BREAKING CHANGE/.test(bodyRaw)) [major, minor, patch] = [major + 1, 0, 0];
    else if (kind === "feat") [minor, patch] = [minor + 1, 0];
    else patch += 1;

    const body = bodyRaw
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.trim() && !/^(Co-Authored-By|Signed-off-by):/i.test(l.trim()));
    const num = (re: RegExp) => Number(stat.match(re)?.[1] ?? 0);

    out.push({
      version: `${major}.${minor}.${patch}`,
      hash,
      date: date.slice(0, 10),
      kind,
      scope,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      body,
      milestone,
      files: num(/(\d+) files? changed/),
      insertions: num(/(\d+) insertions?/),
      deletions: num(/(\d+) deletions?/),
    });
  }
  return out.reverse();
}

export function changelogPlugin(): Plugin {
  const id = "virtual:changelog";
  const resolved = "\0" + id;
  let root = process.cwd();
  return {
    name: "changelog",
    configResolved(config) {
      root = config.root;
    },
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadId) {
      if (loadId !== resolved) return;
      return `export const changelog = ${JSON.stringify(readChangelog(root))};`;
    },
  };
}
