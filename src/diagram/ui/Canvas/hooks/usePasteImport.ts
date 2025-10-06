const uid = () => Math.random().toString(36).slice(2, 10);

import * as React from 'react';
import type { XYPosition } from 'reactflow';
import { tryParseDiagramModel, type DiagramModel, type DiagramNode } from '../../..';
import { findNodeType, PaletteInterface } from '../../../../palette';

type Helpers = {
  screenToFlowPosition: (client: { x: number; y: number }) => XYPosition;
  centerOfViewport: () => XYPosition;
  /** Hace fit al conjunto de nodos por id (centrado + zoom). */
  fitToNodes?: (
    ids: string[],
    opts?: { padding?: number; duration?: number; maxZoom?: number; minZoom?: number },
  ) => Promise<void> | void;
};

type UsePasteImportArgs = {
  palette: PaletteInterface | undefined;
  mode?: 'design' | 'edit' | 'readonly';
  setNodes: (updater: any) => void;
  setEdges: (updater: any) => void;
  helpers: Helpers;
  onError?: (msg: string) => void;
  onImported?: (addedNodes: string[], addedEdges: string[]) => void;
  pasteOffset?: { dx?: number; dy?: number };
  onBusyAcquire?(callback: (release: () => void) => void, msg?: string): void;
};

/** Rejilla simple si el nodo no tiene posición */
function gridFallback(index: number): XYPosition {
  const COLS = 6,
    GAP_X = 200,
    GAP_Y = 160,
    PAD_X = 80,
    PAD_Y = 60;
  const col = index % COLS,
    row = Math.floor(index / COLS);
  return { x: PAD_X + col * GAP_X, y: PAD_Y + row * GAP_Y };
}

function isEditingFocus(): boolean {
  const ae = document.activeElement as HTMLElement | null;
  if (!ae) return false;
  const tag = (ae.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || !!(ae as any).isContentEditable;
}

function toReactFlowAppendables(
  palette: PaletteInterface | undefined,
  doc: DiagramModel,
  existNodeIds: Set<string>,
  opts: { center: XYPosition; pasteOffset?: { dx?: number; dy?: number } },
): { rfNodes: any[]; rfEdges: any[] } {
  const idMap = new Map<string, string>();

  const rfNodes = doc.nodes.map((n, idx) => {
    const def = findNodeType(n.kind, palette?.nodes);
    const size = def?.nodeSize ? def.nodeSize({ props: (n as any).props ?? {} }) : undefined;
    const isBg = !!def?.isBackground?.();

    const style: React.CSSProperties = {};
    const anyN = n as any;
    if (typeof anyN.width === 'number') style.width = anyN.width;
    else if (size?.width) style.width = size.width;
    if (typeof anyN.height === 'number') style.height = anyN.height;
    else if (size?.height) style.height = size.height;
    (style as any).zIndex = isBg ? 0 : 3;

    const newId = existNodeIds.has(n.id) ? uid() : n.id;
    idMap.set(n.id, newId);

    const hasPos = n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number';
    const basePos = hasPos ? n.position! : gridFallback(idx);

    const dx = opts.pasteOffset?.dx ?? 48;
    const dy = opts.pasteOffset?.dy ?? 24;

    const position = hasPos
      ? { x: basePos.x + dx, y: basePos.y + dy }
      : { x: opts.center.x + basePos.x + dx, y: opts.center.y + basePos.y + dy };

    return {
      id: newId,
      type: 'c4',
      data: {
        id: newId,
        kind: n.kind,
        name: n.name,
        props: n.props ?? {},
      } as DiagramNode,
      position,
      style,
      className: isBg ? 'c4-node c4-node--bg' : 'c4-node',
      draggable: true,
      selectable: true,
    };
  });

  const rfEdges = doc.edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e) => ({
      id: uid(),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: 'c4',
      data: {
        kind: e.kind,
        technology: e.technology,
        description: e.description,
      },
    }));

  return { rfNodes, rfEdges };
}

export function usePasteImport({
  palette,
  mode,
  setNodes,
  setEdges,
  helpers,
  onError,
  onImported,
  onBusyAcquire,
  pasteOffset,
}: UsePasteImportArgs) {
  const getExistingIds = React.useCallback(() => {
    let ids = new Set<string>();
    setNodes((prev: any[]) => {
      ids = new Set(prev.map((n) => n.id));
      return prev;
    });
    return ids;
  }, [setNodes]);

  const runBusy = (callback: (release?: () => void) => void, label: string) => {
    if (onBusyAcquire) {
      onBusyAcquire(callback, label); // ← crea token
    } else {
      callback();
    }
  };

  const handlePaste = React.useCallback(
    async (evt: ClipboardEvent) => {
      try {
        if (mode === 'readonly') return;
        if (isEditingFocus()) return;
        const text = evt.clipboardData?.getData('text/plain');
        if (!text) return;
        runBusy((release?: () => void) => {
          try {
            let raw: unknown;
            raw = JSON.parse(text);
            const parsed = tryParseDiagramModel(raw);
            if (parsed.ok) {
              evt.preventDefault();
              const doc = parsed.data;
              const center = helpers.centerOfViewport();
              const exist = getExistingIds();
              const { rfNodes, rfEdges } = toReactFlowAppendables(palette, doc, exist, { center, pasteOffset });

              const addedNodeIds = rfNodes.map((n) => n.id);
              const addedEdgeIds = rfEdges.map((e) => e.id);

              // Añadir y seleccionar pegados
              setNodes((prev: any[]) => {
                // const addedSet = new Set(addedNodeIds);
                // concatenamos y seleccionamos SOLO los nuevos (des-selecciona el resto)
                const next = prev
                  .map((n) => ({ ...n, selected: false }))
                  .concat(rfNodes.map((n) => ({ ...n, selected: true })));
                return next;
              });
              setEdges((prev: any[]) => prev.concat(rfEdges));

              onImported?.(addedNodeIds, addedEdgeIds);

              // Esperar a que React + RF pinten y hacer fit a la selección
              if (helpers.fitToNodes && addedNodeIds.length) {
                setTimeout(async () => {
                  await helpers.fitToNodes?.(addedNodeIds, { padding: 0.2, duration: 300 });
                });
              }
            } else {
              onError?.(`Portapapeles no contiene un DiagramModel válido: ${parsed.error}`);
            }
          } catch (e: any) {
            onError?.('Error: ' + e.message);
          } finally {
            release?.();
          }
        }, 'Building....');
      } catch (e: any) {
        onError?.(e?.message ?? String(e));
      }
    },
    [mode, helpers, getExistingIds, setNodes, setEdges, onError, onImported, pasteOffset],
  );

  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      void handlePaste(e);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handlePaste]);
}
