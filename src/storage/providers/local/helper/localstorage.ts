import { StorageProvider, StorageKind, LocalStorageConfig, FileEntry, normPath, joinPath, baseName } from './types';

const DEFAULT_PREFIX = 'c4fs';

function fullKey(prefix: string, p: string): string {
  return `${prefix}:${normPath(p)}`;
}

export class LocalStorageStorage implements StorageProvider {
  private prefix: string;
  private rootDir?: string;

  constructor(cfg: LocalStorageConfig) {
    this.prefix = cfg.prefix || DEFAULT_PREFIX;
    this.rootDir = cfg.rootDir ? normPath(cfg.rootDir) : undefined;
  }

  writable(): boolean {
    return true;
  }

  kind(): StorageKind {
    return 'localstorage';
  }

  private scoped(path: string): string {
    const p = normPath(path);
    return this.rootDir ? joinPath(this.rootDir, p) : p;
  }

  async list(dir: string): Promise<FileEntry[]> {
    const base = this.scoped(dir || '');
    const entries: FileEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith(this.prefix + ':')) continue;
      const rel = k.slice(this.prefix.length + 1); // quita "prefix:"
      if (base && !rel.startsWith(base + '/')) continue;

      // tomamos solo hijos directos (no recursivo)
      const rest = base ? rel.slice(base.length + 1) : rel;
      if (!rest) continue;
      const slash = rest.indexOf('/');
      if (slash >= 0) {
        // es un subdirectorio
        const dirName = rest.slice(0, slash);
        const dirPath = base ? `${base}/${dirName}` : dirName;
        if (!entries.find((e) => e.type === 'dir' && e.path === normPath(dirPath))) {
          entries.push({ type: 'dir', path: normPath(dirPath), name: dirName });
        }
      } else {
        // archivo directo
        entries.push({
          type: 'file',
          path: rel,
          name: baseName(rel),
          size: localStorage.getItem(k)?.length,
        });
      }
    }
    // Orden por nombre
    entries.sort((a, b) => a.name.localeCompare(b.name));
    return entries;
  }

  async readText(path: string): Promise<string | null> {
    const scoped = this.scoped(path);
    const v = localStorage.getItem(fullKey(this.prefix, scoped));
    return v === null ? null : v;
  }

  async writeText(path: string, content: string): Promise<void> {
    const scoped = this.scoped(path);
    localStorage.setItem(fullKey(this.prefix, scoped), content);
  }

  async delete(path: string): Promise<void> {
    const scoped = this.scoped(path);
    localStorage.removeItem(fullKey(this.prefix, scoped));
  }

  async mkdir(_dir: string): Promise<void> {
    // No hay directorios reales en localStorage; no-op.
    return;
  }

  async exists(path: string): Promise<boolean> {
    const scoped = this.scoped(path);
    return localStorage.getItem(fullKey(this.prefix, scoped)) !== null;
  }

  async readJSON<T = any>(path: string): Promise<T | null> {
    const t = await this.readText(path);
    if (t == null) return null;
    return JSON.parse(t) as T;
  }
  async writeJSON(path: string, data: unknown): Promise<void> {
    const text = JSON.stringify(data, null, 2) + '\n';
    return this.writeText(path, text);
  }
}
