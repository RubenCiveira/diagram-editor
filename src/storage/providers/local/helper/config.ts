export type ProviderKind = 'github' | 'fs' | 'localstorage';

export interface GithubConfig {
  type: 'github';
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  rootDir?: string; // subdirectorio base dentro del repo
}

export interface SharedConfig {
  type: 'shared';
}

export interface LocalStorageConfig {
  type: 'localstorage';
  prefix?: string; // por defecto "c4fs"
  rootDir?: string; // subdirectorio lógico
}

export type AppConfig = GithubConfig | LocalStorageConfig | SharedConfig;

const KEY = 'app:config';

export function listRepositories(): string[] {
  const raw = localStorage.getItem(KEY) || '{}';
  const all = JSON.parse(raw) as any;
  const values = Object.keys(all);
  return ['shared', ...values];
}

export function loadConfig(name: string): AppConfig | null {
  try {
    if (name === 'shared') {
      return {
        type: 'shared',
      };
    }
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as any;
    const parsed = all[name] as AppConfig;
    // sane defaults
    if (parsed.type === 'localstorage' && !parsed.prefix) parsed.prefix = 'c4fs';
    return parsed;
  } catch {
    return null;
  }
}

// export type SharedEntry = {
//   name: string;
//   url: string;
// };

// export function listShared(): SharedEntry[] {}
// export function addToShared(name: string, url: string): void {}
// export function removeFroShared(name: string, url: string): void {}

export function saveConfig(name: string, cfg: AppConfig): void {
  const raw = localStorage.getItem(KEY) || '{}';
  const all = JSON.parse(raw) as any;
  all[name] = cfg;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearConfig(name: string): void {
  const raw = localStorage.getItem(KEY) || '{}';
  const all = JSON.parse(raw) as any;
  delete all[name];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function hasConfig(): boolean {
  return true;
  // return !!loadConfig();
}
