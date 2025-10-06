import { Octokit } from 'octokit';
import { StorageProvider, StorageKind, GithubConfig, FileEntry, normPath, joinPath, baseName } from './types';

function encUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
function toBase64Utf8(str: string): string {
  const bytes = encUTF8(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromBase64Utf8(b64: string): string {
  const clean = b64.replace(/\n/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

export class GithubStorage implements StorageProvider {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch?: string;
  private rootDir?: string;

  // cache de SHA por path para actualizar archivos
  private shaCache = new Map<string, string | undefined>();

  constructor(cfg: GithubConfig) {
    this.octokit = new Octokit({ auth: cfg.token });
    this.owner = cfg.owner;
    this.repo = cfg.repo;
    this.branch = cfg.branch;
    this.rootDir = cfg.rootDir ? normPath(cfg.rootDir) : undefined;
  }

  writable(): boolean {
    return true;
  }

  kind(): StorageKind {
    return 'github';
  }

  private async resolveRef(): Promise<string> {
    if (this.branch) return this.branch;
    const r = await this.octokit.request('GET /repos/{owner}/{repo}', {
      owner: this.owner,
      repo: this.repo,
    });
    // @ts-ignore
    return r.data.default_branch as string;
  }

  private scoped(path: string): string {
    const p = normPath(path);
    return this.rootDir ? joinPath(this.rootDir, p) : p;
  }

  async list(dir: string): Promise<FileEntry[]> {
    const ref = await this.resolveRef();
    const path = this.scoped(dir || '');
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path,
        ref,
      });
      if (Array.isArray(res.data)) {
        // @ts-ignore
        return res.data.map((it) => {
          const type = it.type === 'dir' ? 'dir' : 'file';
          const full = normPath(it.path);
          const rel = this.rootDir ? full.replace(new RegExp(`^${this.rootDir}/?`), '') : full;
          return {
            path: rel,
            name: baseName(rel),
            type,
            sha: it.sha,
            size: it.size,
            updatedAt: (it as any).git_url ? undefined : undefined,
          } as FileEntry;
        });
      } else {
        // era un fichero
        const full = normPath((res.data as any).path);
        const rel = this.rootDir ? full.replace(new RegExp(`^${this.rootDir}/?`), '') : full;
        return [
          {
            path: rel,
            name: baseName(rel),
            type: 'file',
            sha: (res.data as any).sha,
            size: (res.data as any).size,
          },
        ];
      }
    } catch (e: any) {
      if (e.status === 404) return [];
      throw e;
    }
  }

  async readText(path: string): Promise<string | null> {
    const ref = await this.resolveRef();
    const scoped = this.scoped(path);
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: scoped,
        ref,
      });
      if (Array.isArray(res.data)) return null; // es directorio
      const file = res.data as any;
      const text = fromBase64Utf8(String(file.content));
      this.shaCache.set(normPath(path), file.sha as string | undefined);
      return text;
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async writeText(path: string, content: string, message?: string): Promise<void> {
    const ref = await this.resolveRef();
    const scoped = this.scoped(path);
    const rel = normPath(path);
    let sha = this.shaCache.get(rel);

    if (typeof sha === 'undefined') {
      // Intentar recuperar sha si existe
      try {
        const meta = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner: this.owner,
          repo: this.repo,
          path: scoped,
          ref,
        });
        if (!Array.isArray(meta.data)) sha = (meta.data as any).sha as string | undefined;
      } catch (e: any) {
        if (e.status !== 404) throw e;
        sha = undefined;
      }
    }

    const b64 = toBase64Utf8(content);
    const res = await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: this.owner,
      repo: this.repo,
      path: scoped,
      message: message ?? `chore: update ${new Date().toISOString()}`,
      content: b64,
      branch: ref,
      sha,
    });
    // @ts-ignore
    const newSha = res.data?.content?.sha as string | undefined;
    this.shaCache.set(rel, newSha);
  }

  async delete(path: string): Promise<void> {
    const ref = await this.resolveRef();
    const scoped = this.scoped(path);
    let sha = this.shaCache.get(normPath(path));
    if (!sha) {
      // Necesitamos SHA para borrar
      const meta = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: scoped,
        ref,
      });
      if (Array.isArray(meta.data)) return; // es directorio, ignorar
      sha = (meta.data as any).sha as string;
    }
    await this.octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
      owner: this.owner,
      repo: this.repo,
      path: scoped,
      message: `chore: delete ${new Date().toISOString()}`,
      branch: ref,
      sha,
    });
    this.shaCache.delete(normPath(path));
  }

  async mkdir(_dir: string): Promise<void> {
    // GitHub no tiene directorios vacíos; no-op.
    return;
  }

  async exists(path: string): Promise<boolean> {
    const ref = await this.resolveRef();
    const scoped = this.scoped(path);
    try {
      await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: scoped,
        ref,
      });
      return true;
    } catch (e: any) {
      if (e.status === 404) return false;
      throw e;
    }
  }

  async readJSON<T = any>(path: string): Promise<T | null> {
    const t = await this.readText(path);
    if (t == null) return null;
    return JSON.parse(t) as T;
  }
  async writeJSON(path: string, data: unknown, message?: string): Promise<void> {
    const text = JSON.stringify(data, null, 2) + '\n';
    return this.writeText(path, text, message);
  }
}
