import * as React from 'react';
import type { DiagramModel, DiagramNode as NodeData, DiagramEdge } from '../../..';
import { findNodeType, PaletteInterface } from '../../../../palette';

type FallbackPosFn = (n: NodeData, idx: number) => { x: number; y: number };

function gridFallback(index: number): { x: number; y: number } {
  // Rejilla simple 6 columnas con separación amplia
  const COLS = 6;
  const GAP_X = 200;
  const GAP_Y = 160;
  const PAD_X = 80;
  const PAD_Y = 60;
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { x: PAD_X + col * GAP_X, y: PAD_Y + row * GAP_Y };
}
/**
 * Hidrata React Flow desde DiagramModel.
 * - Aplica style.width/style.height si el JSON trae width/height.
 * - Fija z-index inline: 0 para background (notas), 3 para los demás.
 * - Evita re-hidratar en bucle con un "fingerprint" del doc.
 * - Llama a `after()` en un RAF (p.ej. para hacer fit), una vez tras hidratar.
 */
export function useHydrateFromJSON(
  doc: DiagramModel | null,
  palette: PaletteInterface | undefined,
  setNodes: (nodes: any[]) => void,
  setEdges: (edges: any[]) => void,
  setViews: (views: any[]) => void,
  after?: () => void,
  opts?: { defaultPosition?: FallbackPosFn },
) {
  const lastFingerRef = React.useRef<string | null>(null);
  const fallback = opts?.defaultPosition ?? ((_n, i) => gridFallback(i));
  React.useEffect(() => {
    if (!doc) return;
    // Fingerprint ligero: evita re-hidratar si no ha cambiado nada relevante
    const finger = `${doc.updatedAt ?? ''}|${doc.nodes.length}|${doc.edges.length}`;
    if (lastFingerRef.current === finger) return;
    lastFingerRef.current = finger;

    const rfNodes = doc.nodes.map((n: NodeData, idx: number) => {
      const def = findNodeType(n.kind!, palette?.nodes);
      const size = def?.nodeSize ? def.nodeSize({ props: (n as any).props ?? {} }) : undefined;

      const isBg = !!def?.isBackground?.();
      const style: React.CSSProperties = {};

      // tamaño
      if (typeof n.width === 'number') style.width = n.width;
      else if (size?.width) style.width = size.width;

      if (typeof n.height === 'number') style.height = n.height;
      else if (size?.height) style.height = size.height;

      // layering: inline z-index gana a reglas externas
      (style as any).zIndex = isBg ? 0 : 3;

      const hasPos = n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number';

      const pos = hasPos ? n.position : fallback(n, idx);

      return {
        id: n.id,
        type: 'c4',
        data: {
          id: n.id,
          kind: n.kind,
          name: n.name,
          errors: n.errors,
          warns: n.warns,
          props: n.props ?? {},
        },
        position: { x: pos.x, y: pos.y },
        style,
        className: isBg ? 'c4-node c4-node--bg' : 'c4-node',
        draggable: true,
        selectable: true,
      };
    });

    const rfEdges = doc.edges.map((e: DiagramEdge) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: 'c4',
      data: {
        kind: e.kind,
        technology: e.technology,
        description: e.description,
      },
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);
    setViews(doc.views || []);

    // Lanza "after" en el siguiente frame, con el grafo ya montado
    if (after) {
      requestAnimationFrame(() => after());
    }
  }, [doc, setNodes, setEdges, after]);
}
