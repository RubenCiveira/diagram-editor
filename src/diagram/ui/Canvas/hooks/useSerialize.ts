import * as React from 'react';
import type { DiagramModel, DiagramView, DiagramNode as NodeData } from '../../../model';

/**
 * Serializa el estado actual (nodes/edges) a DiagramModel,
 * incluyendo width/height si están disponibles.
 */
export function useSerialize(nodes: Array<any>, edges: Array<any>, createdAt?: string, views?: DiagramView[]) {
  return React.useCallback<() => DiagramModel>(() => {
    const nowIso = new Date().toISOString();
    const doc: DiagramModel = {
      version: '1.0',
      createdAt: createdAt ?? nowIso,
      updatedAt: nowIso,
      nodes: nodes.map((n) => {
        const data: NodeData = n.data;
        // width/height calculados por React Flow (si existen)
        const w =
          typeof n.width === 'number'
            ? n.width
            : n.style && typeof n.style.width === 'number'
              ? n.style.width
              : undefined;
        const h =
          typeof n.height === 'number'
            ? n.height
            : n.style && typeof n.style.height === 'number'
              ? n.style.height
              : undefined;

        const out: NodeData = {
          id: data.id,
          kind: data.kind,
          name: data.name,
          props: data.props ?? {},
          position: { x: n.position?.x ?? 0, y: n.position?.y ?? 0 },
        };

        if (typeof w === 'number' && typeof h === 'number') {
          out.width = w;
          out.height = h;
        }
        return out;
      }),
      edges: edges.map((e) => ({
        id: e.data.id,
        source: e.data.source,
        target: e.data.target,
        sourceHandle: e.data.sourceHandle,
        targetHandle: e.data.targetHandle,
        props: e.data.props ?? {},
        kind: e.data.kind,
      })),
      views: views || [],
    };
    return doc;
  }, [nodes, edges, createdAt, views]);
}
