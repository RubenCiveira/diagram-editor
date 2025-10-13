import React from 'react';
import { ReportDetails } from '../../model';
import { NodeActionItem } from '../../../metadata/FormDefinition';
import { MoreHorizontal } from 'lucide-react';

export default function ReportDialog({
  open,
  details,
  onClose,
}: {
  open: boolean;
  details: ReportDetails | null;
  onClose: () => void;
}) {
  /* -------------------------- Hooks SIEMPRE arriba -------------------------- */

  // Acciones
  const onCopy = React.useCallback(async () => {
    if (!details) {
      alert('No existe contenido');
    } else {
      try {
        await navigator.clipboard.writeText(details.html);
        alert('HTML copiado al portapapeles');
      } catch (e: any) {
        alert('No se pudo copiar: ' + (e?.message ?? String(e)));
      }
    }
  }, [details]);

  const onDownload = React.useCallback(() => {
    try {
      if (!details) {
        alert('No existe contenido');
      } else {
        const blob = new Blob([details.html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = `diagram-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.html`;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      alert('No se pudo descargar: ' + (e?.message ?? String(e)));
    }
  }, [details]);

  const [headerActions, setHeaderActions] = React.useState<NodeActionItem[]>([]);
  const [moreActions, setMoreActions] = React.useState<NodeActionItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = await details?.actions;
      if (!cancelled) setHeaderActions((raw ?? []).filter(Boolean));
    };
    run();
    return () => {
      cancelled = true;
    };
    // Incluye todas las deps que usas dentro
  }, [details]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const raw = await details?.menu;
      if (!cancelled) setMoreActions((raw ?? []).filter(Boolean));
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [details]);

  const handleClickAction = React.useCallback(async (action: NodeActionItem) => {
    try {
      await action.onClick();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  }, []);
  // Popup de configuración
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  /* ------------------------ Early return SIN hooks ------------------------- */
  if (!open) return null;

  /* -------------------------------- Render -------------------------------- */
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          ref={headerRef}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Exportar diagrama</h3>
          <div style={{ display: 'flex', gap: 6 }}></div>
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

        {/* Vista previa integrada */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', maxHeight: '60vh' }}>
          <iframe
            title="preview-export"
            style={{ width: '100%', height: '60vh', background: '#fff' }}
            sandbox="allow-downloads allow-popups allow-modals allow-forms allow-same-origin"
            srcDoc={details?.html || ''}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onCopy} title="Copiar HTML">
            Copiar HTML
          </button>
          <button onClick={onDownload} title="Descargar HTML">
            Descargar HTML
          </button>
          <div style={{ flex: '1' }}></div>
          <button className="primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
