import { ComponentType } from 'react';
import { LocalManager } from './ui';
import { listRepositories } from './helper/config';
import { getActiveStorage, StorageUnavailableError } from './helper/appStorage';
import { FileStorage, Repository, Storage } from '../../Repository';
import { DiagramModel } from '../../../diagram';

export class LocalStorage implements Storage {
  gateComponent(): null | ComponentType<{ onReady: () => void }> {
    return null;
  }

  manager(): ComponentType<any> | null | undefined {
    return LocalManager;
  }

  listRepositories(): Repository[] | Promise<Repository[]> {
    return listRepositories().map((name) => new LocalRepository(name));
  }
}

const withStorage = async <T>(on: string, fn: (storage: any) => Promise<T>): Promise<T> => {
  let storage: any;
  try {
    storage = await getActiveStorage(on);
  } catch (e) {
    if (e instanceof StorageUnavailableError && e.code === 'FS_HANDLE_MISSING') {
      storage = await getActiveStorage(on);
    } else {
      throw e;
    }
  }
  return fn(storage);
};

class LocalRepository implements Repository {
  constructor(private readonly dir: string) {}

  name(): string {
    return this.dir;
  }

  listFiles(): FileStorage[] | Promise<FileStorage[]> {
    return this.doList();
  }

  createFile(name: string): FileStorage | Promise<FileStorage> {
    return this.doCreate(name);
  }

  private async doList(): Promise<FileStorage[]> {
    const list = (await withStorage(this.dir, (storage) => storage.list(''))) as any[];
    return list.filter((e: any) => e.type === 'file').map((e: any) => new LocalFile(e.name, e.path, this.dir));
  }

  private async doCreate(name: string): Promise<FileStorage> {
    const result = await withStorage(this.dir, async (storage) => {
      const exists = await storage.exists(name);
      if (exists) {
        throw new Error('Ya existe un fichero con ese nombre.');
      } else {
        await storage.writeJSON(name, { version: '1.0', nodes: [], edges: [] }, 'chore: create empty diagram');
        return new LocalFile(name, name, this.dir);
      }
    });
    return result;
  }
}

class LocalFile implements FileStorage {
  constructor(
    private readonly fname: string,
    private readonly path: string,
    private readonly dir: string,
  ) {}

  name(): string {
    return this.fname;
  }

  fullName(): string {
    return this.dir + '-' + this.path + '-' + this.fname;
  }

  isWritable(): boolean | Promise<boolean> {
    return this.doCheckWritable();
  }

  read(): DiagramModel | Promise<DiagramModel> {
    return this.doRead();
  }

  delete(): void | Promise<void> {
    return this.doDelete();
  }

  write(diagram: DiagramModel): void | Promise<void> {
    return this.doWrite(diagram);
  }
  private async doCheckWritable(): Promise<boolean> {
    const storage = await getActiveStorage(this.dir);
    return storage.writable();
  }

  private async doDelete(): Promise<void> {
    await withStorage(this.dir, (storage) => storage.delete(this.fname));
  }

  private async doWrite(diagram: DiagramModel): Promise<void> {
    await withStorage(this.dir, (storage) => storage.writeJSON(this.path, diagram, 'chore(diagram): save from app'));
  }
  private async doRead(): Promise<DiagramModel> {
    return await withStorage(this.dir, (storage) => storage.readJSON(this.path));
  }
}
