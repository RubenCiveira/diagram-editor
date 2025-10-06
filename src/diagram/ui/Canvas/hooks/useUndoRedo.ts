// src/hooks/diagram/useUndoRedo.ts
import * as React from 'react';
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from 'reactflow';

type Snapshot = { nodes: any[]; edges: any[] };

function clone<T>(v: T): T {
  // @ts-ignore
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

type Options = {
  limit?: number; // tamaño máximo del histórico
  coalesceWindowMs?: number; // ventana para agrupar cambios (gesto)
  trackSelection?: boolean; // si true, los select/deselect crean snapshot (por defecto false)
  trackDimensions?: boolean; // si true, los changes "dimensions" crean snapshot (por defecto false)
};

export function useUndoRedo(
  nodes: any[],
  setNodes: (updater: any) => void,
  edges: any[],
  setEdges: (updater: any) => void,
  opts?: Options,
) {
  const limit = opts?.limit ?? 50;
  const coalesceWindowMs = opts?.coalesceWindowMs ?? 80;
  const trackSelection = opts?.trackSelection ?? false;
  const trackDimensions = opts?.trackDimensions ?? false;

  const [history, setHistory] = React.useState<Snapshot[]>([]);
  const [cursor, setCursor] = React.useState<number>(-1);

  const restoringRef = React.useRef(false);

  // Últimos estados efectivos tras aplicar cambios (para snapshot coalescado)
  const lastNodesRef = React.useRef<any[]>(nodes);
  const lastEdgesRef = React.useRef<any[]>(edges);

  // Timer para coalescar cambios (mejor que solo RAF)
  const timerRef = React.useRef<number | null>(null);

  // Mantén refs sincronizadas al cambiar estado desde fuera
  React.useEffect(() => {
    lastNodesRef.current = nodes;
  }, [nodes]);
  React.useEffect(() => {
    lastEdgesRef.current = edges;
  }, [edges]);

  const canUndo = cursor > 0;
  const canRedo = cursor >= 0 && cursor < history.length - 1;

  const pushSnapshot = React.useCallback(
    (n: any[], e: any[]) => {
      setHistory((h) => {
        const base = h.slice(0, cursor + 1); // descarta futuros
        const snap: Snapshot = { nodes: clone(n), edges: clone(e) };
        const next = base.concat(snap).slice(-limit);
        setCursor(next.length - 1);
        return next;
      });
    },
    [cursor, limit],
  );

  const scheduleSnapshot = React.useCallback(() => {
    if (restoringRef.current) return; // no snap al restaurar undo/redo
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      pushSnapshot(lastNodesRef.current, lastEdgesRef.current);
    }, coalesceWindowMs);
  }, [pushSnapshot, coalesceWindowMs]);

  // Primer snapshot al montar (estado inicial)
  React.useEffect(() => {
    if (cursor === -1) {
      const snap: Snapshot = { nodes: clone(nodes), edges: clone(edges) };
      setHistory([snap]);
      setCursor(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = React.useCallback(() => {
    if (restoringRef.current) return;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pushSnapshot(lastNodesRef.current, lastEdgesRef.current);
  }, [pushSnapshot]);

  const undo = React.useCallback(() => {
    if (!canUndo) return;
    restoringRef.current = true;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const nextIndex = cursor - 1;
    const snap = history[nextIndex];
    setNodes(clone(snap.nodes));
    setEdges(clone(snap.edges));
    lastNodesRef.current = snap.nodes;
    lastEdgesRef.current = snap.edges;
    setCursor(nextIndex);
    restoringRef.current = false;
  }, [canUndo, cursor, history, setNodes, setEdges]);

  const redo = React.useCallback(() => {
    if (!canRedo) return;
    restoringRef.current = true;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const nextIndex = cursor + 1;
    const snap = history[nextIndex];
    setNodes(clone(snap.nodes));
    setEdges(clone(snap.edges));
    lastNodesRef.current = snap.nodes;
    lastEdgesRef.current = snap.edges;
    setCursor(nextIndex);
    restoringRef.current = false;
  }, [canRedo, cursor, history, setNodes, setEdges]);

  // --- filtros de cambios “ruido” ---
  const meaningfulNodeChanges = React.useCallback(
    (changes: NodeChange[]) => {
      return changes.filter((ch) => {
        if (ch.type === 'select' && !trackSelection) return false;
        if (ch.type === 'dimensions' && !trackDimensions) return false;
        return true;
      });
    },
    [trackSelection, trackDimensions],
  );

  const meaningfulEdgeChanges = React.useCallback(
    (changes: EdgeChange[]) => {
      return changes.filter((ch) => {
        if (ch.type === 'select' && !trackSelection) return false;
        return true;
      });
    },
    [trackSelection],
  );

  // Handlers: aplican cambios y solo programan snapshot si hubo cambios “con significado”
  const onNodesChangeWithHistory = React.useCallback(
    (changes: NodeChange[]) => {
      const filtered = meaningfulNodeChanges(changes);
      setNodes((prev: any[]) => {
        const next = applyNodeChanges(changes, prev); // aplicamos todo (también select), para UI
        lastNodesRef.current = next;
        return next;
      });
      if (filtered.length > 0) scheduleSnapshot();
    },
    [setNodes, meaningfulNodeChanges, scheduleSnapshot],
  );

  const onEdgesChangeWithHistory = React.useCallback(
    (changes: EdgeChange[]) => {
      const filtered = meaningfulEdgeChanges(changes);
      setEdges((prev: any[]) => {
        const next = applyEdgeChanges(changes, prev);
        lastEdgesRef.current = next;
        return next;
      });
      if (filtered.length > 0) scheduleSnapshot();
    },
    [setEdges, meaningfulEdgeChanges, scheduleSnapshot],
  );

  return {
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
    onNodesChangeWithHistory,
    onEdgesChangeWithHistory,
  };
}
