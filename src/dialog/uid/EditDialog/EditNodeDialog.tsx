import React, { useCallback, useRef, useState } from 'react';
import { SchemaForm } from '../../../metadata/ui';
import { MoreHorizontal } from 'lucide-react';
import { FormDefinition, NodeActionItem } from '../../../metadata/FormDefinition';
import { FormDetail } from '../../../dialog/model';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { SchemaFormRef, SchemaFormState } from '../../../metadata/ui/SchemaForm/SchemaForm';

export default function EditNodeDialog({
  open,
  readOnly,
  typeDef,
  onCancel,
  onSave,
}: {
  open: boolean;
  readOnly: boolean;
  typeDef: null | FormDetail<any>;
  onCancel: () => void;
  onSave: (updated: { name: string; props: Record<string, any> }) => void;
}) {
  // ---- State & refs (siempre al principio, sin condicionales) ----
  const [title, setTitle] = React.useState<string>('');
  const [isWizzard, setIsWizzard] = React.useState(false);
  const [definition, setDefinition] = React.useState<FormDefinition | null>(null);
  const [_isLoading, setIsLoading] = React.useState(false);
  const [_error, setError] = React.useState<string | null>(null);

  const [propsData, setPropsData] = React.useState<Record<string, any>>({});
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const formRef = useRef<SchemaFormRef>(null);

  const setFormRef = useCallback((inst: SchemaFormRef | null) => {
    formRef.current = inst;
  }, []);

  const [formState, setFormState] = useState<SchemaFormState>();

  const updateState = useCallback(
    (inst: SchemaFormState) => {
      setFormState(inst);
    },
    [formState, setFormState],
  );

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
        const def = await typeDef.definition;
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

  React.useEffect(() => {
    setIsWizzard( !!Array.isArray(definition?.schema) );
  }, [definition]);

  React.useEffect(() => {
    setTitle(typeDef?.title ?? '');
    setPropsData(typeDef?.value);
    setMenuOpen(false);
  }, [open]);

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
      const finalName = patch?.name ?? title;
      const finalProps = patch?.props ?? propsData;
      onSave({ name: finalName, props: finalProps });
    },
    [title, propsData, onSave],
  );

  const [headerActions, setHeaderActions] = React.useState<NodeActionItem[]>([]);
  const [moreActions, setMoreActions] = React.useState<NodeActionItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = await typeDef?.actions;
      if (!cancelled) setHeaderActions((raw ?? []).filter(Boolean));
    };
    run();
    return () => {
      cancelled = true;
    };
    // Incluye todas las deps que usas dentro
  }, [typeDef, propsData]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = await typeDef?.menu;
      if (!cancelled) setMoreActions((raw ?? []).filter(Boolean));
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [typeDef, propsData]);

  const handleClickAction = React.useCallback(async (action: NodeActionItem) => {
    try {
      await action.onClick();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  }, []);

  const handleSubmit = React.useCallback(() => performSave(), [performSave]);

  // ---- Salida condicional (DESPUÉS de declarar todos los hooks) ----
  if (!open || !typeDef) return null;

  const titleShema: RJSFSchema = {
    type: 'object',
    // $defs al nivel raíz para mantener rutas #/$defs/*
    properties: {
      title: { type: 'string', title: 'Title', description: '/users' },
    },
    required: ['title'],
  };
  const titleUi: UiSchema = {};

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

        {typeDef.errors && typeDef.errors.length > 0 && (
          <div>
            <h3>Errors:</h3> {typeDef.errors}
          </div>
        )}
        {typeDef.warns && typeDef.warns.length > 0 && (
          <div>
            <h3>Warns:</h3> {typeDef.warns}
          </div>
        )}

        {/* Campo "Nombre" */}
        {typeDef?.title !== undefined && (
          <SchemaForm
            schema={titleShema}
            uiSchema={titleUi}
            formData={{ title: title }}
            onChange={(d) => setTitle(d.title) }
            onSubmit={() => handleSubmit()}
            disabled={readOnly}
            liveValidate={true}
          />
        )}

        {/* Formulario JSON Schema */}
        {definition && (
          <SchemaForm
            ref={setFormRef}
            schema={definition.schema}
            uiSchema={definition.ui}
            formData={propsData}
            onUpdate={updateState}
            onChange={(d) => setPropsData(d)}
            disabled={readOnly}
            onSubmit={() => handleSubmit()}
            liveValidate={true}
          />
        )}

        <div className="modal-footer">
          <button onClick={onCancel}>Cancelar</button>
          {isWizzard && (
            <>
              <button disabled={!formState?.hasPrev || !formState?.canAccept} onClick={formRef.current?.prev}>
                Prev
              </button>
              <button disabled={!formState?.hasNext || !formState?.canAccept} onClick={formRef.current?.next}>
                Next
              </button>
            </>
          )}
          <button className="primary" disabled={readOnly || !formState?.canSave} onClick={handleSubmit}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
