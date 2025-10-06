import { createStorage } from './createStorage';
import type { StorageProvider } from './types';
import { loadConfig } from './config';

export class StorageUnavailableError extends Error {
  code: 'NO_CONFIG' | 'FS_HANDLE_MISSING';
  constructor(code: 'NO_CONFIG' | 'FS_HANDLE_MISSING', message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Devuelve el StorageProvider activo según configuración.
 * Si el proveedor es FS y aún no hay handle, lanza StorageUnavailableError('FS_HANDLE_MISSING').
 */
export async function getActiveStorage(name: string): Promise<StorageProvider> {
  const cfg = loadConfig(name);
  if (!cfg) {
    throw new StorageUnavailableError('NO_CONFIG', 'No hay configuración de almacenamiento.');
  }
  if (cfg.type === 'shared') {
    return createStorage({ type: 'shared' });
  }

  if (cfg.type === 'github') {
    return createStorage({
      type: 'github',
      token: cfg.token,
      owner: cfg.owner,
      repo: cfg.repo,
      branch: cfg.branch,
      rootDir: cfg.rootDir,
    });
  }

  // localstorage
  return createStorage({
    type: 'localstorage',
    prefix: cfg.prefix || 'c4fs',
    rootDir: cfg.rootDir,
  });
}
