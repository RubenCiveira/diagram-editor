import React from 'react';

export default function ReportDialog({
  open,
  html,
  onClose,
}: {
  open: boolean;
  html: string | null;
  onClose: () => void;
}) {
  /* -------------------------- Hooks SIEMPRE arriba -------------------------- */

  // Acciones
  const onCopy = React.useCallback(async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      alert('HTML copiado al portapapeles');
    } catch (e: any) {
      alert('No se pudo copiar: ' + (e?.message ?? String(e)));
    }
  }, [html]);

  const onDownload = React.useCallback(() => {
    if (!html) return;
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = `diagram-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.html`;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('No se pudo descargar: ' + (e?.message ?? String(e)));
    }
  }, [html]);

  // Popup de configuración
  const headerRef = React.useRef<HTMLDivElement | null>(null);

  /* ------------------------ Early return SIN hooks ------------------------- */
  if (!open || !html) return null;

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
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onCopy} title="Copiar HTML">Copiar HTML</button>
            <button className="primary" onClick={onDownload} title="Descargar HTML">Descargar HTML</button>
          </div>
        </div>

        {/* Vista previa integrada */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', maxHeight: '60vh' }}>
          <iframe
            title="preview-export"
            style={{ width: '100%', height: '60vh', background: '#fff' }}
            sandbox="allow-downloads allow-popups allow-modals allow-forms allow-same-origin"
            srcDoc={html || ''}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
