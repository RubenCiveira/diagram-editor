import { useCallback } from 'react';
import { addEdge, MarkerType } from 'reactflow';
import { findNodeType, PaletteInterface } from '../../../../palette';
import { DiagramEdge } from '../../../model';

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * onConnect con soporte para conexiones verticales padre→hijo y bloqueo de combinaciones inválidas:
 * - Vertical válida SOLO si: sourceHandle === 'children' && targetHandle === 'parent'
 * - Si interviene cualquiera de esos handles pero no ambos en su posición correcta, se rechaza.
 * - Vertical restringida a tipos: gateway → api.
 * - El resto de conexiones (laterales) pasan por la validación general canConnect.
 */
export function useOnConnect(
  palette: PaletteInterface | undefined,
  setEdges: (updater: any) => void,
  canConnect: (s: string, t: string) => { ok: true } | { ok: false; reason: string },
  canNest: (s: string, t: string) => { ok: true } | { ok: false; reason: string },
  nodes: any[],
) {
  return useCallback(
    (
      params: {
        source?: string;
        target?: string;
        sourceHandle?: string | null;
        targetHandle?: string | null;
      } & any,
    ) => {
      const id = uid();
      const source = params.source!;
      const target = params.target!;
      const sh = params.sourceHandle ?? null;
      const th = params.targetHandle ?? null;

      // ¿Interviene algún conector vertical?
      const usesVertical = sh === 'children' || th === 'parent';

      const defProps = {};
      const data = {
        id,
        acive: false,
        kind: usesVertical ? 'parentChild' : 'lateral',
        source: source,
        target: target,
        sourceHandle: sh,
        targetHandle: th,
        props: defProps,
      } as DiagramEdge;

      if (usesVertical) {
        // Debe ser EXACTAMENTE children -> parent
        if (sh !== 'children') {
          alert('Conexión descendente inválida: debes iniciar desde el conector inferior del padre.');
          return;
        }
        if (th !== 'parent') {
          alert('Conexión descendente inválida: debes conectar al conector superior del hijo.');
          return;
        }

        // Verificamos tipos, capacidades y reglas del dominio
        const src = nodes.find((n: any) => n.id === source)?.data ?? null;
        const tgt = nodes.find((n: any) => n.id === target)?.data ?? null;
        if (!src || !tgt) {
          alert('No se han encontrado origen o destino.');
          return;
        }

        const srcType = findNodeType(src.kind!, palette);
        const tgtType = findNodeType(tgt.kind!, palette);

        const srcAllowsChildren = srcType?.acceptsChilds?.() ?? false;
        const tgtAllowsParent = tgtType?.acceptsParents?.() ?? false;

        if (!srcAllowsChildren) {
          alert('El nodo origen no admite hijos.');
          return;
        }
        if (!tgtAllowsParent) {
          alert('El nodo destino no admite un padre.');
          return;
        }

        // Restricción de tipos vertical: gateway → api
        if (!(src.kind === 'gateway' && tgt.kind === 'api')) {
          alert('Solo se permite conexión vertical: gateway → api.');
          return;
        }

        // Validación general del dominio (verifyConnectTo, etc.)
        const res = canNest(source, target);
        if (!res.ok) {
          alert(`Conexión inválida: ${res.reason}`);
          return;
        }

        setEdges((eds: any[]) =>
          addEdge(
            {
              id,
              ...params,
              type: 'c4',
              markerEnd: { type: MarkerType.ArrowClosed },
              data,
              style: { strokeWidth: 2.75 },
            },
            eds,
          ),
        );
      } else {
        // En conexiones NO verticales, bloquear cualquier intento con handles verticales fuera de lugar
        if (sh === 'children' || th === 'parent') {
          alert('Los conectores verticales (padre/hijo) solo pueden usarse entre sí (inferior→superior).');
          return;
        }

        // Validación general para laterales
        const res = canConnect(source, target);
        if (!res.ok) {
          alert(`Conexión inválida: ${res.reason}`);
          return;
        }
        setEdges((eds: any[]) =>
          addEdge(
            {
              id,
              ...params,
              type: 'c4',
              markerEnd: { type: MarkerType.ArrowClosed },
              data,
              style: { strokeWidth: 2.75 },
            },
            eds,
          ),
        );
      }
    },
    [setEdges, canConnect, canNest, nodes],
  );
}
