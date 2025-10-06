import type { StorageConfig, StorageProvider } from './types';
import { GithubStorage } from './github';
import { LocalStorageStorage } from './localstorage';
import { SharedStorageProvider } from './sharedStorageProvider';

export async function createStorage(cfg: StorageConfig): Promise<StorageProvider> {
  switch (cfg.type) {
    case 'github':
      return new GithubStorage(cfg);
    case 'localstorage':
      return new LocalStorageStorage(cfg);
    case 'shared':
      return new SharedStorageProvider();
    default:
      // @ts-ignore
      throw new Error(`Tipo de storage no soportado: ${(cfg as any)?.type}`);
  }
}
