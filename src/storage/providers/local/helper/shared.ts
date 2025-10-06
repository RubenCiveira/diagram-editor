// services/shared.ts

export type SharedEntry = {
  name: string;
  url: string;
};

const SHARED_STORAGE_KEY = 'c4fs-shared-entries';

export function listShared(): SharedEntry[] {
  try {
    const stored = localStorage.getItem(SHARED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading shared entries:', e);
    return [];
  }
}

export function addToShared(name: string, url: string): void {
  if (!name.trim() || !url.trim()) {
    throw new Error('El nombre y la URL son obligatorios');
  }

  const entries = listShared();

  // Verificar que no existe ya una entrada con el mismo nombre
  if (entries.some((entry) => entry.name === name)) {
    throw new Error(`Ya existe una entrada compartida con el nombre "${name}"`);
  }

  // Verificar que no existe ya la misma URL
  if (entries.some((entry) => entry.url === url)) {
    throw new Error('Esta URL ya está añadida a los compartidos');
  }

  entries.push({ name: name.trim(), url: url.trim() });

  try {
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    throw new Error('Error al guardar la entrada compartida');
  }
}

export function removeFromShared(name: string): void {
  const entries = listShared();
  const filteredEntries = entries.filter((entry) => !(entry.name === name));

  try {
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(filteredEntries));
  } catch (e) {
    throw new Error('Error al eliminar la entrada compartida');
  }
}

export function clearAllShared(): void {
  try {
    localStorage.removeItem(SHARED_STORAGE_KEY);
  } catch (e) {
    throw new Error('Error al limpiar las entradas compartidas');
  }
}
