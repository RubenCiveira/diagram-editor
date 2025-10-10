import { ComponentType } from 'react';
import { DiagramModel } from '../diagram';

export interface Storage {
  manager(): ComponentType<any> | null | undefined;
  listRepositories(): Repository[] | Promise<Repository[]>;
  gateComponent(): null | ComponentType<{ onReady: () => void }>; // | Promise<ComponentType<{ onReady: () => void }>>;
}

export interface Repository {
  name(): string;
  loadFile(name: string): FileStorage | Promise<FileStorage | null>;
  listFiles(): FileStorage[] | Promise<FileStorage[]>;
  createFile(name: string): FileStorage | Promise<FileStorage>;
  searchFile?(): Promise<FileStorage>;
}

export interface FileStorage {
  name(): string;
  fullName(): string;
  isWritable(): boolean | Promise<boolean>;
  delete(): void | Promise<void>;
  read(): DiagramModel | Promise<DiagramModel>;
  write(diagram: DiagramModel): void | Promise<void>;
}
