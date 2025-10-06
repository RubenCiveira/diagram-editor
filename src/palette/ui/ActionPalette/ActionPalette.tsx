import React from 'react';
import { X } from 'lucide-react';
import './ActionPalette.scss';
import { ActionItem } from '../../ActionItem';
import { DiagramModel } from '../../../diagram';
import { FormDefinition } from '../../../metadata/FormDefinition';
import { SchemaForm } from '../../../metadata/ui';
import {
  getNodesBounds,
  getViewportForBounds,
  ReactFlowInstance,
} from 'reactflow';
import { toSvg } from 'html-to-image';

/** Resultado de una acción de paleta */
export type ActionResult = {
  content?: string; // HTML para previsualizar
};

/** Acción con formulario opcional (schema) */
type Props = {
  actions: ActionItem[];
  open: boolean;
  onClose(): void;
  title?: string;
  /** Función que devuelve el grafo actual serializado */
  getGraph: () => DiagramModel | null;
  setGraph: (diagram: DiagramModel) => void;
  getCanva?: () => ReactFlowInstance;
  /** Para mostrar HTML resultante en el diálogo de exportación del padre */
  onShowHtml?: (html: string) => void;
};

export default function ActionPalette({
  actions,
  open,
  onClose,
  title = 'Acciones',
  getGraph,
  setGraph,
  getCanva,
  onShowHtml,
}: Props) {
  // const actions = ACTION_MAP;
  const [pending, setPending] = React.useState<ActionItem | null>(null);
  const [definition, setDefinition] = React.useState<FormDefinition | null>(null);
  const [formData, setFormData] = React.useState<any>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  const closeAll = () => {
    setPending(null);
    setDefinition(null);
    setFormData({});
    setError(null);
    setBusy(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const getFullNode = async () => {
    const rf = getCanva?.();
    if (!rf) {
      throw new Error('NO RF TO CHECK');
    }
    const nodes = rf.getNodes();
    if (!nodes.length) {
      throw new Error('NO NODES TO CHECK');
    }
    const bounds = getNodesBounds(nodes);
    const paddingPx = 32;
    const exportW = Math.ceil(bounds.width + paddingPx * 2);
    const exportH = Math.ceil(bounds.height + paddingPx * 2);

    const root = document.querySelector('.react-flow') as HTMLElement | null;
    const renderer = root?.querySelector('.react-flow__renderer') as HTMLElement | null;
    if (!root || !renderer) {
      throw new Error('NO ROOT/RENDERER TO EXPORT');
    }

    const prevViewport = rf.getViewport();
    const originalStyle = root.getAttribute('style') || '';

    // 4) transform para ese W×H (NO fitView)
    //    const [tx, ty, tzoom] = getTransformForBounds(bounds, exportW, exportH, 0.1, 4, padding);
    const vp = getViewportForBounds(bounds, exportW, exportH, 0.9, 0.9, 100);
    rf.setViewport(vp, { duration: 0 });

    // 5) aplicar tamaño y viewport temporal
    root.style.width = `${exportW}px`;
    root.style.height = `${exportH}px`;
    root.classList.add('rf-exporting');

    await new Promise(requestAnimationFrame);

    const dataUrl = await toSvg(renderer, {
      backgroundColor: 'white',
      width: exportW,
      height: exportH,
      filter: (el) => {
        const h = el as HTMLElement;
        if (h.closest?.('.react-flow__panel')) return false;
        if (h.classList?.contains('react-flow__attribution')) return false;
        return true;
      },
      style: {
        width: `${exportW}px`,
        height: `${exportH}px`,
      },
    });
    return {
      root,
      dataUrl,
      rf,
      prevViewport,
      originalStyle,
    };
  };
  const resetNode = async (node: any) => {
    // 8) Restaura estado visual
    node.root.setAttribute('style', node.originalStyle);
    node.rf.setViewport(node.prevViewport, { duration: 0 });
    node.root.classList.remove('rf-exporting');
    await new Promise(requestAnimationFrame);
  };

  const onActionClick = async (item: ActionItem) => {
    setError(null);
    const graph = getGraph();
    if (!graph) {
      console.error('No graph');
      return;
    }

    // Si la acción define schema → abrir modal de formulario
    const definition = await item.definition?.();
    if (definition) {
      setDefinition(definition);
      setPending(item);
      setFormData({});
      return;
    }

    // Acciones sin formulario: ejecuta ya
    const node = await getFullNode(); // document.querySelector('.react-flow');
    try {
      setBusy(true);
      const result = await item.run(graph, {}, node.dataUrl);
      setGraph({ ...graph });
      onClose();
      if (result?.content && onShowHtml) {
        // Cerramos la paleta y pedimos al padre que abra el diálogo de exportación con HTML
        onShowHtml(result.content);
      }
    } catch (e: any) {
      console.error( e );
      setError(e?.message ?? String(e));
    } finally {
      await resetNode(node);
      setBusy(false);
    }
  };

  const onFormSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!pending) return;
    const graph = getGraph();
    const node = await getFullNode(); // document.querySelector('.react-flow');
    if (!graph || !node) {
      console.error('El nodo es ', node);
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const result = await pending.run(graph, formData, node.dataUrl);
      // Cerramos la paleta antes de abrir la previsualización para evitar problemas de z-index
      onClose();
      setGraph({ ...graph });
      if (result?.content && onShowHtml) {
        onShowHtml(result.content);
      }
    } catch (e: any) {
      console.error( e );
      setError(e?.message ?? String(e));
    } finally {
      await resetNode(node);
      setBusy(false);
      setPending(null);
      setDefinition(null);
      setFormData({});
    }
  };

  const onFormCancel = () => {
    setPending(null);
    setDefinition(null);
    setFormData({});
    setError(null);
  };

  return (
    <>
      {/* Paleta lateral (derecha) */}
      <div
        className="palette-backdrop palette-backdrop--right"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label="Acciones del diagrama"
      >
        <div className="palette-drawer palette-drawer--right" onClick={stop}>
          <div className="palette-header">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={closeAll} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>

          {busy && <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280' }}>Ejecutando…</div>}
          {error && (
            <div
              style={{
                marginBottom: 8,
                padding: 8,
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div className="palette-list">
            {actions.map((a) => (
              <button
                key={a.id}
                className="palette-item"
                onClick={() => onActionClick(a)}
                title={a.subtitle || a.title}
                style={a.danger ? { borderColor: '#fecaca', background: '#fff1f2' } : undefined}
              >
                <span className="palette-icon">{a.icon ?? '⚙️'}</span>
                <div className="palette-title" style={{ display: 'grid' }}>
                  <span>{a.title}</span>
                  {a.subtitle && <small style={{ color: '#6b7280' }}>{a.subtitle}</small>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal con SchemaForm (solo si la acción define schema) */}
      {pending && definition && definition.schema && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={pending.title}>
          <div className="modal">
            <h3 style={{ margin: 0, marginBottom: 8 }}>{pending.title}</h3>
            {pending.subtitle && <p style={{ margin: '4px 0 12px 0', color: '#6b7280' }}>{pending.subtitle}</p>}

            <div>
              <SchemaForm schema={definition.schema} formData={formData} onChange={(data) => setFormData(data)} />

              {error && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#991b1b',
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={onFormCancel} disabled={busy}>
                  Cancelar
                </button>
                <button type="submit" onClick={onFormSubmit} className="primary" disabled={busy}>
                  {busy ? 'Procesando…' : 'Ejecutar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
