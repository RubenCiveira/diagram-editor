// src/components/ViewDialog.tsx
import React from 'react';
import type { DiagramView } from '../..';

type Props = {
  open: boolean;
  allNodes: Array<{ id: string; label: string }>;
  /** Vista a editar; si es null, se crea una nueva */
  initial?: DiagramView | null;
  onCancel(): void;
  onSave(view: DiagramView): void;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ViewDialog({ open, allNodes, initial, onCancel, onSave }: Props) {
  const [name, setName] = React.useState<string>(initial?.name ?? '');
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(initial?.includeNodeIds ?? []),
  );
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setSelected(new Set(initial?.includeNodeIds ?? []));
      setSearch('');
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const filtered = allNodes.filter(
    (n) =>
      n.id.toLowerCase().includes(search.toLowerCase()) ||
      n.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const checkAll = () => {
    setSelected(new Set(filtered.map((n) => n.id)));
  };
  const uncheckAll = () => {
    setSelected(new Set());
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) {
      setError('Pon un nombre para la vista.');
      return;
    }
    const view: DiagramView = {
      id: initial?.id ?? `v_${uid()}`,
      name: name.trim(),
      version: '0',
      includeNodeIds: Array.from(selected),
      includeTypesIds: []
    };
    onSave(view);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Configurar vista">
      <div className="modal" style={{ width: 'min(720px, 96vw)' }}>
        <h3 style={{ marginTop: 0 }}>{initial ? 'Editar vista' : 'Crear vista'}</h3>

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Nombre
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Vista Backend"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Nodos visibles
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nodos…"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={checkAll}>Marcar visibles</button>
                <button type="button" onClick={uncheckAll}>Ocultar todos</button>
              </div>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  maxHeight: '50vh',
                  overflow: 'auto',
                  padding: 8,
                  background: '#fff',
                }}
              >
                {filtered.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 13 }}>No hay nodos coincidentes…</div>
                ) : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {filtered.map((n) => (
                      <label key={n.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(n.id)}
                          onChange={() => toggle(n.id)}
                        />
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                          {n.id}
                        </span>
                        <span>— {n.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
              }}
            >
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="primary">{initial ? 'Guardar cambios' : 'Crear vista'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
