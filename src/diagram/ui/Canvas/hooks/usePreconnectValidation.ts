import { useCallback } from 'react';
import type { DiagramNode } from '../../..';
import type { DiagramElementType } from '../../../../palette/DiagramElementType';
import { findNodeType, PaletteInterface } from '../../../../palette';

/**
 * Extrae un DiagramNode desde un ReactFlow Node o ya un DiagramNode.
 */
function asDiagramNode(n: any): DiagramNode | null {
  if (!n) return null;
  // Caso 1: ya es DiagramNode
  if (typeof n.kind === 'string') return n as DiagramNode;
  // Caso 2: React Flow Node con data: DiagramNode
  if (n.data && typeof n.data.kind === 'string') return n.data as DiagramNode;
  return null;
}

/**
 * Valida "a priori" si un nodo de tipo targetKind (con props por defecto)
 * podría conectarse desde un nodo origen (sourceId).
 * - No crea nodos ni aristas.
 * - Usa verifyConnectTo() del tipo origen si existe.
 * - Verifica también acceptsOutgoing() (origen) y acceptsIncoming() (destino) con sus props actuales/por defecto.
 *
 * IMPORTANTE: pásale el array de nodos tal y como está en el estado de React Flow
 * (es decir, [{ id, data: DiagramNode, ... }]). Este hook ya hace el unwrap.
 */
export function usePreconnectValidation(palette: PaletteInterface | undefined, nodes: any[]) {
  return useCallback(
    (sourceId: string, targetKind: DiagramNode['kind']): { ok: true } | { ok: false; reason: string } => {
      if (!targetKind) {
        return { ok: false, reason: 'No se ha indicado el tipo destino (kind).' };
      }

      const rawSource = nodes.find((n: any) => n?.id === sourceId);
      const sourceNode = asDiagramNode(rawSource);

      if (!rawSource || !sourceNode) {
        return { ok: false, reason: `No se encuentra el nodo origen (${sourceId}) o sus datos.` };
      }

      const sourceType: DiagramElementType<any> | undefined = findNodeType(sourceNode.kind, palette?.nodes);
      if (!sourceType) {
        return { ok: false, reason: `Tipo de nodo origen desconocido: ${String(sourceNode.kind)}.` };
      }

      const targetType: DiagramElementType<any> | undefined = findNodeType(targetKind, palette?.nodes);
      if (!targetType) {
        return { ok: false, reason: `Tipo de nodo destino desconocido: ${String(targetKind)}.` };
      }

      const targetDefaultProps = targetType.defaultProps?.() ?? {};

      // Reglas básicas de handles
      const srcAllowsOut = sourceType.acceptsOutgoing?.() ?? true;
      if (!srcAllowsOut) {
        return { ok: false, reason: 'El nodo origen no admite conexiones salientes.' };
      }

      const tgtAllowsIn = targetType.acceptsIncoming?.() ?? true;
      if (!tgtAllowsIn) {
        return { ok: false, reason: 'El tipo destino no admite conexiones entrantes.' };
      }

      // Nodo destino simulado para validaciones específicas
      const fakeTarget: DiagramNode = {
        id: '__preview__',
        kind: targetKind,
        name: targetType.title,
        position: { x: 0, y: 0 },
        ...(targetDefaultProps ? { props: targetDefaultProps } : {}),
      } as any;

      try {
        sourceType.verifyConnectTo?.({
          source: sourceNode as any,
          target: fakeTarget,
          targetKind,
          targetType,
        });
        targetType.verifyConnectFrom?.({
          source: sourceNode as any,
          target: fakeTarget,
          sourceKind: sourceNode.kind,
          sourceType: sourceType,
        });
      } catch (e: any) {
        return { ok: false, reason: e?.message ?? String(e) };
      }

      return { ok: true };
    },
    [nodes],
  );
}
