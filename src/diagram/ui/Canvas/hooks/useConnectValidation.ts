import { useCallback } from 'react';
import type { DiagramNode } from '../../..';
import { findNodeType, PaletteInterface } from '../../../../palette';

/**
 * Valida conexiones consultando al tipo del nodo ORIGEN:
 *  - Comprueba acceptsOutgoing(origin) y acceptsIncoming(target)
 *  - Invoca verifyConnectTo() del tipo origen; si lanza, se considera inválida
 */
export function useConnectValidation(nodes: any[], palette: PaletteInterface | undefined) {
  return useCallback(
    (sourceNodeId: string, targetNodeId: string) => {
      const src = (nodes as any[]).find((n) => n.id === sourceNodeId)?.data as DiagramNode | undefined;
      const tgt = (nodes as any[]).find((n) => n.id === targetNodeId)?.data as DiagramNode | undefined;

      if (!src || !tgt) return { ok: false, reason: 'Nodo inexistente' };
      const srcType = findNodeType(src.kind, palette);
      const tgtType = findNodeType(tgt.kind, palette);
      if (!srcType || !tgtType) return { ok: false, reason: 'Tipo de nodo desconocido' };

      const sOut = srcType.acceptsOutgoing?.() ?? true;
      const tIn = tgtType.acceptsIncoming?.() ?? true;

      if (!sOut) return { ok: false, reason: 'El origen no admite salidas' };
      if (!tIn) return { ok: false, reason: 'El destino no admite entradas' };

      try {
        srcType.verifyConnectTo?.({
          source: src as any,
          target: tgt,
          targetKind: tgt.kind,
          targetType: tgtType,
        });
        tgtType.verifyConnectFrom?.({
          source: src as any,
          target: tgt,
          sourceKind: src.kind,
          sourceType: srcType,
        });
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false, reason: e?.message ?? 'Conexión no permitida por el tipo origen' };
      }
    },
    [nodes],
  );
}
