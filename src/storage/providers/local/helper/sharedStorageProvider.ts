import { FileEntry, StorageKind, StorageProvider, normPath } from './types';
import { listShared, type SharedEntry } from './shared';

export class SharedStorageProvider implements StorageProvider {
  private entries: SharedEntry[];

  constructor() {
    this.entries = listShared();
  }

  writable(): boolean {
    return false;
  }

  kind(): StorageKind {
    return 'localstorage'; // Técnicamente usa localStorage para la lista
  }

  /** Lista todas las entradas compartidas como archivos virtuales */
  async list(dir: string): Promise<FileEntry[]> {
    const normalizedDir = normPath(dir);

    // Solo mostramos archivos en el directorio raíz
    if (normalizedDir !== '' && normalizedDir !== '.') {
      return [];
    }

    // Refrescar las entradas por si han cambiado
    this.entries = listShared();

    return this.entries.map((entry, _index) => ({
      path: `${entry.name}.json`, // Asumimos que son diagramas JSON
      name: `${entry.name}.json`,
      type: 'file' as const,
      size: undefined, // No conocemos el tamaño hasta que se descargue
      updatedAt: new Date().toISOString(), // Fecha actual como placeholder
    }));
  }

  /** Lee el contenido de una URL compartida */
  async readText(path: string): Promise<string | null> {
    const normalizedPath = normPath(path);
    const entryName = normalizedPath.replace(/\.json$/, '');

    const entry = this.entries.find((e) => e.name === entryName);
    if (!entry) {
      return null;
    }

    try {
      const response = await fetch(entry.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        return await response.text();
      } else {
        throw new Error('El contenido no es texto o JSON válido');
      }
    } catch (error) {
      console.error(`Error fetching shared content from ${entry.url}:`, error);
      throw new Error(
        `No se pudo cargar el contenido de "${entry.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /** Los elementos compartidos son de solo lectura */
  async writeText(_path: string, _content: string, _message?: string): Promise<void> {
    throw new Error('Los elementos compartidos son de solo lectura');
  }

  /** Los elementos compartidos no se pueden eliminar desde aquí */
  async delete(_path: string): Promise<void> {
    throw new Error(
      'Los elementos compartidos son de solo lectura. Usa el gestor de repositorios para eliminar entradas.',
    );
  }

  /** No se pueden crear directorios en compartidos */
  async mkdir(_dir: string): Promise<void> {
    throw new Error('Los elementos compartidos no soportan la creación de directorios');
  }

  /** Verifica si existe una entrada compartida */
  async exists(path: string): Promise<boolean> {
    const normalizedPath = normPath(path);
    const entryName = normalizedPath.replace(/\.json$/, '');

    // Refrescar las entradas
    this.entries = listShared();

    return this.entries.some((e) => e.name === entryName);
  }

  /** Lee JSON de una URL compartida */
  async readJSON<T = any>(path: string): Promise<T | null> {
    const text = await this.readText(path);
    if (text === null) return null;

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Error al parsear JSON de "${path}": ${error instanceof Error ? error.message : 'JSON inválido'}`,
      );
    }
  }

  /** Los elementos compartidos son de solo lectura */
  async writeJSON(_path: string, _data: unknown, _message?: string): Promise<void> {
    throw new Error('Los elementos compartidos son de solo lectura');
  }
}
