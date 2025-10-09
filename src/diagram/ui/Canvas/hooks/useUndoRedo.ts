// useUndoRedo.ts
import * as React from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type NodePositionChange,
} from 'reactflow';

type Snapshot = { nodes: Node[]; edges: Edge[] };

export type UndoRedoOptions = {
  limit?: number; // máx. entradas en histórico
  resizableTypes?: string[]; // tipos que registran dimensions
  trackResize?: 'never' | 'end' | 'always';
  resizeDebounceMs?: number; // para 'always' o sin flag resizing
  groupWithinMs?: number; // ⟵ ventana de agrupado (estilo n8n)
};

export function useUndoRedo(
  nodes: Node[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  edges: Edge[],
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  opts: UndoRedoOptions = {},
) {
  const {
    limit = 100,
    resizableTypes = [],
    trackResize = 'end',
    groupWithinMs = 150, // << recomendado 120–200ms
  } = opts;

  // ---------- Refs base ----------
  const selectedIdsRef = React.useRef<Set<string>>(new Set());
  const lastNodesRef = React.useRef<Node[]>(nodes);
  const lastEdgesRef = React.useRef<Edge[]>(edges);
  const applyingRef = React.useRef(false);

  const pastRef = React.useRef<Snapshot[]>([]);
  const futureRef = React.useRef<Snapshot[]>([]);
  const [, force] = React.useState(0);

  React.useEffect(() => {
    lastNodesRef.current = nodes;
  }, [nodes]);
  React.useEffect(() => {
    lastEdgesRef.current = edges;
  }, [edges]);

  const microtask =
    typeof queueMicrotask === 'function' ? queueMicrotask : (cb: () => void) => Promise.resolve().then(cb);

  // ---------- Helpers ----------
  const stripUiFromNodes = (arr: Node[]): Node[] =>
    arr.map(({ selected, dragging, width, height, positionAbsolute, zIndex, ...n }) => n as Node);

  const stripUiFromEdges = (arr: Edge[]): Edge[] => arr.map(({ selected, ...e }) => e as Edge);

  const signature = (s: Snapshot) =>
    JSON.stringify({
      n: s.nodes.map((n) => ({ id: n.id, t: n.type, p: n.position, d: n.data })),
      e: s.edges.map((e) => ({ id: e.id, s: e.source, t: e.target, ty: e.type, d: e.data })),
    });

  function rehydrateSelection(arr: Node[]): Node[] {
    const sel = selectedIdsRef.current;
    return arr.map((n) =>
      sel.has(n.id) ? (n.selected ? n : { ...n, selected: true }) : n.selected ? { ...n, selected: false } : n,
    );
  }

  const isMeaningfulNodeChange = (c: NodeChange) => {
    if (c.type === 'select' || c.type === 'reset') return false;
    if (c.type === 'position') return !(c as NodePositionChange).dragging; // al soltar
    if (c.type === 'dimensions') {
      if (trackResize === 'never') return false;
      const node = lastNodesRef.current.find((n) => n.id === c.id);
      const isResizable = resizableTypes.length === 0 || (node && resizableTypes.includes(node.type || ''));
      if (!isResizable) return false;
      const resizingFlag = (c as any).resizing;
      if (trackResize === 'end') return resizingFlag === false || typeof resizingFlag === 'undefined';
      return true; // 'always' -> ya haremos debounce
    }
    return true; // add/remove/update
  };

  const isMeaningfulEdgeChange = (c: EdgeChange) => c.type !== 'select';

  // ---------- Snapshot scheduler (cancelable + ventana de agrupado) ----------
  const schedRef = React.useRef<{ queued: boolean; lastSig: string; groupTimer: any | null }>({
    queued: false,
    lastSig: '',
    groupTimer: null,
  });

  const cancelScheduledSnapshot = React.useCallback(() => {
    schedRef.current.queued = false;
    if (schedRef.current.groupTimer) {
      clearTimeout(schedRef.current.groupTimer);
      schedRef.current.groupTimer = null;
    }
  }, []);

  // Empuja AHORA (sin grouping) — usar al cerrar transacciones explícitas si hiciera falta
  const pushSnapshotNow = React.useCallback(() => {
    if (applyingRef.current) return;
    const snap: Snapshot = {
      nodes: stripUiFromNodes(lastNodesRef.current),
      edges: stripUiFromEdges(lastEdgesRef.current),
    };
    const nsig = signature(snap);
    if (nsig === schedRef.current.lastSig) return;
    pastRef.current.push(snap);
    if (pastRef.current.length > limit) pastRef.current.shift();
    futureRef.current = [];
    schedRef.current.lastSig = nsig;
    force((x) => x + 1);
  }, [limit]);

  // Agrupa llamadas dentro de groupWithinMs y luego empuja 1 snapshot
  const scheduleSnapshot = React.useCallback(() => {
    if (applyingRef.current) return;
    // marca como "hay snapshot pendiente"
    schedRef.current.queued = true;

    // (re)programa el timer de agrupación
    if (schedRef.current.groupTimer) clearTimeout(schedRef.current.groupTimer);
    schedRef.current.groupTimer = setTimeout(() => {
      schedRef.current.groupTimer = null;
      if (!schedRef.current.queued || applyingRef.current) return;
      schedRef.current.queued = false;
      pushSnapshotNow();
    }, groupWithinMs);
  }, [groupWithinMs, pushSnapshotNow]);

  // Debounce para resize 'always' o sin flag
  const resizeTimeoutRef = React.useRef<number | null>(null);
  const scheduleResizeSnapshot = React.useCallback(() => {
    if (resizeTimeoutRef.current) window.clearTimeout(resizeTimeoutRef.current);
    resizeTimeoutRef.current = window.setTimeout(() => {
      resizeTimeoutRef.current = null;
      scheduleSnapshot();
    }, opts.resizeDebounceMs ?? 80) as unknown as number;
  }, [scheduleSnapshot, opts.resizeDebounceMs]);

  const applySnapshot = React.useCallback(
    (snap: Snapshot) => {
      applyingRef.current = true;

      const selectedNow = new Set(lastNodesRef.current.filter((n) => n.selected).map((n) => n.id));
      selectedIdsRef.current = selectedNow;

      setNodes(() => {
        const next = snap.nodes.map((n) => ({
          ...n,
          selected: selectedNow.has(n.id),
          dragging: false,
        }));
        lastNodesRef.current = next;
        return next;
      });

      setEdges(() => {
        lastEdgesRef.current = snap.edges;
        return snap.edges;
      });

      // sincroniza firma con lo aplicado
      schedRef.current.lastSig = signature({
        nodes: stripUiFromNodes(lastNodesRef.current),
        edges: stripUiFromEdges(lastEdgesRef.current),
      });

      microtask(() => {
        applyingRef.current = false;
      });
    },
    [setNodes, setEdges],
  );

  // siembra histórico inicial
  React.useEffect(() => {
    if (pastRef.current.length === 0) {
      pastRef.current.push({
        nodes: stripUiFromNodes(lastNodesRef.current),
        edges: stripUiFromEdges(lastEdgesRef.current),
      });
      schedRef.current.lastSig = signature(pastRef.current[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Merge & buffering por micro-tarea ----------
  function mergeNodeChanges(changes: NodeChange[]): NodeChange[] {
    const lastByKey = new Map<string, NodeChange>();
    const lastSelectById = new Map<string, NodeChange>();
    const key = (c: NodeChange) => `${c.type}:${(c as any).id ?? '_'}`;

    for (const c of changes) {
      if (c.type === 'select') {
        if (c.id) lastSelectById.set(c.id, c);
        continue;
      }
      if (c.type === 'position') {
        const k = key(c);
        const prev = lastByKey.get(k) as NodePositionChange | undefined;
        const curr = c as NodePositionChange;
        if (!prev) lastByKey.set(k, curr);
        else lastByKey.set(k, !prev.dragging && curr.dragging ? prev : curr);
        continue;
      }
      lastByKey.set(key(c), c); // dimensions/add/remove/update...
    }

    // filtra selects que no cambian el estado final
    const effectiveSelects = Array.from(lastSelectById.values()).filter((sel) => {
      const id = (sel as any).id!;
      const next = (sel as any).selected as boolean;
      const prev = selectedIdsRef.current.has(id);
      return next !== prev;
    });

    return [...lastByKey.values(), ...effectiveSelects]; // selects al final
  }

  const bufferedNodeChangesRef = React.useRef<NodeChange[] | null>(null);
  const microtaskScheduledRef = React.useRef(false);

  const flushBufferedNodeChanges = React.useCallback(() => {
    microtaskScheduledRef.current = false;
    const buffered = bufferedNodeChangesRef.current ?? [];
    bufferedNodeChangesRef.current = null;
    if (!buffered.length) return;

    const merged = mergeNodeChanges(buffered);

    // actualiza selección con los selects fusionados
    for (const c of merged) {
      if (c.type === 'select' && c.id) {
        (c as any).selected ? selectedIdsRef.current.add(c.id) : selectedIdsRef.current.delete(c.id);
      }
    }

    // aplica TODO de una vez y rehidrata (evita flash)
    setNodes((prev) => {
      const next = applyNodeChanges(merged, prev);
      const next2 = rehydrateSelection(next);
      lastNodesRef.current = next2;
      return next2;
    });

    // decidir snapshot
    if (!applyingRef.current) {
      const onlySelectOrReset = merged.every((c) => c.type === 'select' || c.type === 'reset');
      if (!onlySelectOrReset) {
        const onlyDims = merged.every((c) => c.type === 'dimensions');
        const hasMeaningful = merged.some(isMeaningfulNodeChange);
        if (hasMeaningful) {
          if (onlyDims && trackResize === 'always') scheduleResizeSnapshot();
          else scheduleSnapshot();
        }
      }
    }
  }, [setNodes, scheduleSnapshot, scheduleResizeSnapshot, trackResize]);

  const isSelectionOnly = (changes: NodeChange[]) => changes.every((c) => c.type === 'select');

  const onNodesChangeWithHistory = React.useCallback(
    (changes: NodeChange[]) => {
      // fast-path: sólo selección ⇒ aplica ya (sin buffer ni snapshot)
      if (isSelectionOnly(changes)) {
        for (const c of changes) {
          if (c.type === 'select' && c.id) {
            (c as any).selected ? selectedIdsRef.current.add(c.id) : selectedIdsRef.current.delete(c.id);
          }
        }
        setNodes((prev) => {
          const next = applyNodeChanges(changes, prev);
          const next2 = rehydrateSelection(next);
          lastNodesRef.current = next2;
          return next2;
        });
        return;
      }

      // resto ⇒ buffer en micro-tarea
      if (!bufferedNodeChangesRef.current) bufferedNodeChangesRef.current = [];
      bufferedNodeChangesRef.current.push(...changes);

      if (!microtaskScheduledRef.current) {
        microtaskScheduledRef.current = true;
        microtask(flushBufferedNodeChanges);
      }
    },
    [setNodes, flushBufferedNodeChanges],
  );

  const onEdgesChangeWithHistory = React.useCallback(
    (changes: EdgeChange[]) => {
      setEdges((prev) => {
        const next = applyEdgeChanges(changes, prev);
        lastEdgesRef.current = next;
        return next;
      });

      if (applyingRef.current) return;
      if (changes.every((c) => c.type === 'select')) return;
      if (changes.some(isMeaningfulEdgeChange)) {
        scheduleSnapshot();
      }
    },
    [setEdges, scheduleSnapshot],
  );

  // ---------- API ----------
  const commit = React.useCallback(() => {
    scheduleSnapshot();
  }, [scheduleSnapshot]);

  const undo = React.useCallback(() => {
    if (pastRef.current.length <= 1) return;
    cancelScheduledSnapshot();

    const current = pastRef.current.pop()!; // actual → future
    futureRef.current.push(current);

    const prev = pastRef.current[pastRef.current.length - 1];
    applySnapshot(prev);
    force((x) => x + 1);
  }, [applySnapshot, cancelScheduledSnapshot]);

  const redo = React.useCallback(() => {
    if (!futureRef.current.length) return;
    cancelScheduledSnapshot();

    const next = futureRef.current.pop()!;
    pastRef.current.push(next);
    applySnapshot(next);
    force((x) => x + 1);
  }, [applySnapshot, cancelScheduledSnapshot]);

  const canUndo = pastRef.current.length > 1;
  const canRedo = futureRef.current.length > 0;

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
