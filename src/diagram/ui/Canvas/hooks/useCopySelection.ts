import * as React from 'react';
import type { Edge } from 'reactflow';
import type { DiagramModel, DiagramNode as DNode, DiagramEdge as DEdge, DiagramEdge, EdgeKind } from '../../..';

function isEditingFocus(): boolean {
  const ae = document.activeElement as HTMLElement | null;
  if (!ae) return false;
  const tag = (ae.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || !!(ae as any).isContentEditable;
}

/**
 * Utilidad: deduce el tipo lógico de arista si faltara, a partir de los handles.
 * parentChild = sourceHandle:'children' y targetHandle:'parent'; si no, lateral.
 */
function edgeInferKind(e: DiagramEdge): EdgeKind {
  if (e.kind) return e.kind;
  if (e.sourceHandle === 'children' && e.targetHandle === 'parent') return 'parentChild';
  return 'lateral';
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      return true;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

type UseCopySelectionArgs = {
  nodes: any[];
  edges: Edge[];
  onDone?: (copiedJson: DiagramModel) => void;
  onError?: (msg: string) => void;
};

/**
 * Copia al portapapeles un DiagramModel con:
 * - los nodos seleccionados (id/kind/name/props/position y width/height si están en style)
 * - las aristas cuyas puntas están ambas en la selección (manteniendo sourceHandle/targetHandle y metadatos)
 */
export function useCopySelection({ nodes, edges, onDone, onError }: UseCopySelectionArgs) {
  const buildJson = React.useCallback((): DiagramModel | null => {
    const selected = nodes.filter((n) => n?.selected);
    if (!selected.length) return null;

    const selIds = new Set<string>(selected.map((n) => n.id));

    const outNodes: DNode[] = selected.map((n) => {
      const width = Number(n?.style?.width);
      const height = Number(n?.style?.height);
      const dn: any = {
        id: n.id,
        kind: n?.data?.kind,
        name: n?.data?.name,
        props: n?.data?.props ?? {},
        position: { x: n?.position?.x ?? 0, y: n?.position?.y ?? 0 },
      };
      // si existen tamaños en el nodo RF, los añadimos (tu hidrator los soporta de forma tolerante)
      if (!Number.isNaN(width)) dn.width = width;
      if (!Number.isNaN(height)) dn.height = height;
      return dn as DNode;
    });

    const outEdges: DEdge[] = edges
      .filter((e) => selIds.has(e.source) && selIds.has(e.target))
      .map((e) => {
        const de: DEdge = {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: (e as any).sourceHandle,
          targetHandle: (e as any).targetHandle,
          kind: edgeInferKind({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: (e as any).sourceHandle,
            targetHandle: (e as any).targetHandle,
          } as any),
          description: (e as any).data?.description,
          technology: (e as any).data?.technology,
        };
        return de;
      });

    const now = new Date().toISOString();
    return {
      version: '1.0',
      createdAt: now,
      updatedAt: now,
      nodes: outNodes,
      edges: outEdges,
      views: [],
    };
  }, [nodes, edges]);

  const copySelection = React.useCallback(async () => {
    try {
      const json = buildJson();
      if (!json) {
        onError?.('No hay nodos seleccionados.');
        return false;
      }
      const text = JSON.stringify(json, null, 2);
      const ok = await writeClipboard(text);
      if (!ok) {
        onError?.('No se pudo copiar al portapapeles.');
        return false;
      }
      onDone?.(json);
      return true;
    } catch (e: any) {
      onError?.(e?.message ?? String(e));
      return false;
    }
  }, [buildJson, onDone, onError]);

  // Atajo Cmd/Ctrl+C (solo cuando no estamos escribiendo en inputs/textareas)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() !== 'c') return;
      if (isEditingFocus()) return;

      const hasSel = nodes.some((n) => n?.selected);
      if (!hasSel) return;

      e.preventDefault();
      void copySelection();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nodes, copySelection]);

  return { copySelection };
}
