import React from 'react';
import { DiagramNode } from '../..';
import { SchemaForm } from '../../../metadata/ui';
import { MoreHorizontal } from 'lucide-react';
import { FormDefinition } from '../../../metadata/FormDefinition';
import type { DiagramElementType, NodeActionContext, NodeActionItem } from '../../../palette/DiagramElementType';

export default function EditNodeDialog({
  open,
  readOnly,
  node,
  typeDef,
  onCancel,
  onSave,
}: {
  open: boolean;
  readOnly: boolean;
  node: DiagramNode | null;
  typeDef?: DiagramElementType<any>;
  onCancel: () => void;
  onSave: (updated: { name: string; props: Record<string, any> }) => void;
}) {
  // ---- State & refs (siempre al principio, sin condicionales) ----
  const [name, setName] = React.useState<string>('');
  const [definition, setDefinition] = React.useState<FormDefinition | null>(null);
  const [_isLoading, setIsLoading] = React.useState(false);
  const [_error, setError] = React.useState<string | null>(null);

  const [propsData, setPropsData] = React.useState<Record<string, any>>({});
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const loadDefinition = async () => {
      if (!typeDef) {
        setDefinition(null);
        setIsLoading(false);
        setError(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const def = await typeDef.definition();
        setDefinition(def || null);
      } catch (err) {
        console.error('Error loading definition:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setDefinition(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefinition();
  }, [typeDef]);

  // Inicializa estado cuando cambia el nodo (permitido condicional dentro del efecto)
  React.useEffect(() => {
    if (!node) return;
    setName(node.name ?? '');
    setPropsData((node as any).props ?? {});
    setMenuOpen(false);
  }, [node, open]);

  // Cierra dropdown al clickar fuera
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  // ---- Hooks MEMO/CALLBACK (definidos SIEMPRE, sin condicionales) ----
  const performSave = React.useCallback(
    (patch?: Partial<{ name: string; props: Record<string, any> }>) => {
      const finalName = patch?.name ?? name;
      const finalProps = patch?.props ?? propsData;
      onSave({ name: finalName, props: finalProps });
    },
    [name, propsData, onSave],
  );

  // Para evitar condicionales, creamos un ctx válido aunque el nodo sea null (no se usará si no hay diálogo)
  const ctx: NodeActionContext = React.useMemo(
    () => ({
      node: (node as DiagramNode) ?? ({ id: 'unknown', kind: 'note', position: { x: 0, y: 0 } } as any),
      name,
      props: propsData,
      setName,
      setProps: (next: any) => {
        if (typeof next === 'function') {
          setPropsData((prev) => (next as any)(prev));
        } else {
          setPropsData(next);
        }
      },
      close: onCancel,
      save: performSave,
    }),
    [node, name, propsData, onCancel, performSave],
  );

  const [headerActions, setHeaderActions] = React.useState<NodeActionItem[]>([]);
  const [moreActions, setMoreActions] = React.useState<NodeActionItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = await typeDef?.getHeaderActions?.(propsData, node!);
      if (!cancelled) setHeaderActions((raw ?? []).filter(Boolean));
    };
    run();
    return () => {
      cancelled = true;
    };
    // Incluye todas las deps que usas dentro
  }, [typeDef, propsData, node, ctx]);
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = await typeDef?.getMoreMenuActions?.(propsData, node!);
      if (!cancelled) setMoreActions((raw??[]).filter(Boolean));
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [typeDef, propsData, node, ctx]);

  const handleClickAction = React.useCallback(
    async (action: NodeActionItem) => {
      try {
        await action.onClick();
      } catch (e: any) {
        alert(e?.message ?? String(e));
      }
    },
    [ctx],
  );

  const handleSubmit = React.useCallback(() => performSave(), [performSave]);

  // ---- Salida condicional (DESPUÉS de declarar todos los hooks) ----
  if (!open || !node || !typeDef) return null;

  // ---- Render del diálogo ----
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header con título y acciones */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}
        >
          <h3 style={{ margin: 0 }}>{typeDef.title}</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {headerActions.map((a, idx) => (
              <button
                key={idx}
                onClick={() => handleClickAction(a)}
                disabled={a.disabled}
                title={a.title ?? a.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  border: '1px solid #e5e7eb',
                  background: a.danger ? '#fee2e2' : '#fff',
                  color: a.danger ? '#991b1b' : 'inherit',
                  borderRadius: 8,
                }}
              >
                <span aria-hidden>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}

            {moreActions.length > 0 && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  aria-label="Más acciones"
                  title="Más acciones"
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{
                    width: 36,
                    height: 32,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    borderRadius: 8,
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 6,
                      minWidth: 220,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      boxShadow: '0 10px 30px rgba(0,0,0,.15)',
                      zIndex: 20,
                      overflow: 'hidden',
                    }}
                  >
                    {moreActions.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMenuOpen(false);
                          handleClickAction(m);
                        }}
                        disabled={m.disabled}
                        title={m.title ?? m.label}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          background: '#fff',
                          border: 'none',
                          borderBottom: '1px solid #f1f5f9',
                          color: m.danger ? '#991b1b' : 'inherit',
                        }}
                      >
                        <span aria-hidden>{m.icon}</span>
                        <span style={{ textAlign: 'left' }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {node.errors && (
          <div>
            <h3>Errors:</h3> {node.errors}
          </div>
        )}
        {node.warns && (
          <div>
            <h3>Warns:</h3> {node.warns}
          </div>
        )}

        {/* Campo "Nombre" */}
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="node-name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Nombre
          </label>
          <input
            id="node-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del elemento"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        </div>

        {/* Formulario JSON Schema */}
        {definition && (
          <SchemaForm
            schema={definition.schema}
            uiSchema={definition.ui}
            formData={propsData}
            onChange={(d) => setPropsData(d)}
            disabled={readOnly}
            onSubmit={() => handleSubmit()}
            liveValidate={false}
          />
        )}

        <div className="modal-footer">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" onClick={handleSubmit} disabled={readOnly}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
