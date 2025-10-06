import React from 'react';
import { X } from 'lucide-react';
import './ActionPalette.scss';
import { ActionItem } from '../../ActionItem';
import { DiagramModel } from '../../../diagram';
import {
  getNodesBounds,
  getViewportForBounds,
  ReactFlowInstance,
} from 'reactflow';
import { toSvg } from 'html-to-image';
import { AppContext } from '../../../app/AppContext';
import { DiagramDescriptor } from '../../../diagram/descriptor';

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
};

export default function ActionPalette({
  actions,
  open,
  onClose,
  title = 'Acciones',
  getGraph,
  setGraph,
  getCanva,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const appContext = React.useContext(AppContext);

  if (!open) return null;

  const closeAll = () => {
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

    // Acciones sin formulario: ejecuta ya
    const node = await getFullNode(); // document.querySelector('.react-flow');
    try {
      setBusy(true);
      await item.exec( new DiagramDescriptor(graph, () => Promise.resolve(node.dataUrl), appContext.palette?.nodes || [] ));
      setGraph({ ...graph });
      onClose();
      console.log("ON CLOSE");
    } catch (e: any) {
      console.error( e );
      setError(e?.message ?? String(e));
    } finally {
      await resetNode(node);
      setBusy(false);
    }
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
    </>
  );
}
