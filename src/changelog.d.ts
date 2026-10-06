// Generated at build time from git history by vite-plugin-changelog.ts (newest release first).
declare module "virtual:changelog" {
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
  export const changelog: ChangelogEntry[];
}
