// useDeleteSelection.ts
import * as React from 'react';
import type { Node, Edge } from 'reactflow';

function isTypingTarget(el: Element | null) {
  if (!el) return false;
  const he = el as HTMLElement;
  const tag = he.tagName.toLowerCase();
  return he.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
}

export function useDeleteSelection(
  getNodes: () => Node[],                               // función que devuelva el array actual (o usa ref)
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  getEdges: () => Edge[],
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  opts?: {
    commit?: () => void;                                // para undo/redo
    cancelScheduledSnapshot?: () => void;               // si usas scheduler
    protectNode?: (n: Node) => boolean;                 // para impedir borrar algunos (p.ej. background)
  }
) {
  const onDelete = React.useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();

    // nodos a borrar
    const toDeleteNodeIds = new Set(
      nodes.filter(n => n.selected && !(opts?.protectNode?.(n))).map(n => n.id)
    );

    if (toDeleteNodeIds.size === 0) {
      // no hay nodos: borra sólo edges seleccionados
      const toDeleteEdgeIds = new Set(edges.filter(e => e.selected).map(e => e.id));
      if (toDeleteEdgeIds.size === 0) return;

      opts?.cancelScheduledSnapshot?.();
      setEdges(prev => prev.filter(e => !toDeleteEdgeIds.has(e.id)));
      opts?.commit?.();
      return;
    }

    // edges a borrar: los seleccionados o los que toquen nodos borrados
    const toDeleteEdges = new Set(
      edges
        .filter(e => e.selected || toDeleteNodeIds.has(e.source) || toDeleteNodeIds.has(e.target))
        .map(e => e.id)
    );

    // un solo paso: quitamos edges y nodos a la vez
    opts?.cancelScheduledSnapshot?.();
    setEdges(prev => prev.filter(e => !toDeleteEdges.has(e.id)));
    setNodes(prev => prev.filter(n => !toDeleteNodeIds.has(n.id)));
    opts?.commit?.();
  }, [getNodes, setNodes, getEdges, setEdges, opts]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDelete]);
}
