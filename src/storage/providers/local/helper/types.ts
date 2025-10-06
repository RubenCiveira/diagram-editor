export type StorageKind = 'github' | 'fs' | 'localstorage';

export type GithubConfig = {
  type: 'github';
  token: string;
  owner: string;
  repo: string;
  branch?: string; // opcional, default branch si no se pasa
  rootDir?: string; // directorio “base” dentro del repo (sin Slash inicial)
};

export type FSAccessConfig = {
  type: 'fs';
  /** Handle de directorio elegido con showDirectoryPicker() */
  handle: FileSystemDirectoryHandle;
  rootDir?: string; // subdirectorio dentro del handle
};

export type LocalStorageConfig = {
  type: 'localstorage';
  /** Prefijo de claves en localStorage, por defecto "c4fs" */
  prefix?: string;
  /** “rootDir” lógico (simplemente prefijará rutas internamente) */
  rootDir?: string;
};

export interface SharedConfig {
  type: 'shared';
}

export type StorageConfig = GithubConfig | FSAccessConfig | LocalStorageConfig | SharedConfig;

export type EntryType = 'file' | 'dir';

export interface FileEntry {
  path: string; // ruta relativa al root configurado
  name: string; // basename
  type: EntryType;
  size?: number;
  sha?: string; // (GitHub) SHA actual del blob
  updatedAt?: string; // ISO opcional
}

export interface StorageProvider {
  writable(): boolean;
  kind(): StorageKind;
  /** Lista entradas DIRECTAS en un directorio (no recursivo) */
  list(dir: string): Promise<FileEntry[]>;
  /** Lee texto; devuelve null si no existe */
  readText(path: string): Promise<string | null>;
  /** Escribe texto (crea o actualiza). `message` puede usarse como commit msg en github */
  writeText(path: string, content: string, message?: string): Promise<void>;
  /** Borra fichero; si no existe, no falla */
  delete(path: string): Promise<void>;
  /** Crea un directorio (no recursivo; implementaciones pueden ser no-op) */
  mkdir(dir: string): Promise<void>;
  /** Existe ruta (archivo o directorio) */
  exists(path: string): Promise<boolean>;

  // Helpers
  readJSON<T = any>(path: string): Promise<T | null>;
  writeJSON(path: string, data: unknown, message?: string): Promise<void>;
}

export function normPath(p: string): string {
  const s = (p || '').replace(/^[\\/]+/, '').replace(/\\/g, '/');
  return s.replace(/\/+/g, '/');
}
export function joinPath(a: string, b: string): string {
  if (!a) return normPath(b);
  if (!b) return normPath(a);
  return normPath(`${a.replace(/\/+$/, '')}/${b.replace(/^\/+/, '')}`);
}
export function baseName(p: string): string {
  const n = normPath(p);
  const idx = n.lastIndexOf('/');
  return idx >= 0 ? n.slice(idx + 1) : n;
}
