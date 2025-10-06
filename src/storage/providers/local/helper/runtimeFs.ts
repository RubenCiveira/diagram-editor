// src/services/runtimeFs.ts
let fsHandle: FileSystemDirectoryHandle | null = null;

export function setFsHandle(handle: FileSystemDirectoryHandle | null) {
  fsHandle = handle;
}

export function getFsHandle(): FileSystemDirectoryHandle | null {
  return fsHandle;
}
