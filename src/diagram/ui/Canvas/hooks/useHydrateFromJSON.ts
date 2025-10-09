import * as React from 'react';
import type { DiagramModel, DiagramNode as NodeData, DiagramEdge } from '../../..';
import { findNodeType, PaletteInterface } from '../../../../palette';
import { Edge, Node } from 'reactflow';

type FallbackPosFn = (n: NodeData, idx: number) => { x: number; y: number };

// ---- Parámetros de layout (ajustables) ----
const COL_X_GAP = 320; // separación horizontal entre columnas
const ROW_Y_GAP = 40; // separación vertical mínima entre nodos de una columna
const PAD_X = 80; // margen izquierdo
const PAD_Y = 60; // margen superior
const COLLISION_PAD = 16; // acolchado anti-solape vertical
const DEFAULT_W = 180;
const DEFAULT_H = 100;

// ---- util colisiones verticales (columna fija en X) ----
type Slot = { y: number; h: number };
function overlapsY(a: Slot, b: Slot, pad = 0) {
  return !(a.y + a.h + pad <= b.y - pad || b.y + b.h + pad <= a.y - pad);
}
function findFreeYNear(
  desiredY: number,
  h: number,
  occupied: Slot[],
  step = 20,
  maxSteps = 200,
  padding = COLLISION_PAD,
): number {
  const base: Slot = { y: desiredY, h };
  if (occupied.every((o) => !overlapsY(base, o, padding))) return desiredY;
  for (let i = 1; i <= maxSteps; i++) {
    const up: Slot = { y: desiredY - i * step, h };
    if (occupied.every((o) => !overlapsY(up, o, padding))) return up.y;
    const dn: Slot = { y: desiredY + i * step, h };
    if (occupied.every((o) => !overlapsY(dn, o, padding))) return dn.y;
  }
  return desiredY;
}

// ---- cálculo de columnas (ranks) con “anclajes” de X fijos ----
function computeRanks(
  ids: string[],
  edges: Array<{ u: string; v: string }>,
  fixedX: Map<string, number> | null,
): Map<string, number> {
  const rank = new Map<string, number>();

  // anclar columnas según X
  if (fixedX && fixedX.size) {
    const minX = Math.min(...Array.from(fixedX.values()));
    for (const [id, x] of fixedX) {
      rank.set(id, Math.max(0, Math.round((x - minX) / COL_X_GAP)));
    }
  }

  // relajación de restricciones v ≥ u + 1 (unas pasadas)
  const MAX_ITERS = 8;
  for (let it = 0; it < MAX_ITERS; it++) {
    let changed = false;
    for (const { u, v } of edges) {
      const ru = rank.get(u);
      const rv = rank.get(v);
      if (ru != null && (rv == null || rv < ru + 1)) {
        rank.set(v, ru + 1);
        changed = true;
      }
      if (rv != null && (ru == null || ru > rv - 1)) {
        rank.set(u, rv - 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // completar con BFS desde fuentes
  const inDeg = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const { v } of edges) inDeg.set(v, (inDeg.get(v) ?? 0) + 1);
  const q: string[] = [];
  for (const id of ids) if ((inDeg.get(id) ?? 0) === 0) q.push(id);
  while (q.length) {
    const u = q.shift()!;
    if (rank.get(u) == null) rank.set(u, 0);
    const ru = rank.get(u)!;
    for (const e of edges)
      if (e.u === u) {
        if ((rank.get(e.v) ?? -Infinity) < ru + 1) rank.set(e.v, ru + 1);
        inDeg.set(e.v, (inDeg.get(e.v) ?? 1) - 1);
        if ((inDeg.get(e.v) ?? 0) === 0) q.push(e.v);
      }
  }

  // normalizar a ≥ 0 y fallback
  const vals = Array.from(rank.values());
  const minR = vals.length ? Math.min(...vals) : 0;
  if (minR < 0) for (const k of rank.keys()) rank.set(k, (rank.get(k) ?? 0) - minR);
  for (const id of ids) if (rank.get(id) == null) rank.set(id, 0);

  return rank;
}

/**
 * Hidrata React Flow desde DiagramModel con layout L→R:
 * - Respeta `position` dada.
 * - Para nodos sin `position`: columna por restricción de aristas y Y estimado por vecinos ya colocados.
 */
export function useHydrateFromJSON(
  doc: DiagramModel | null,
  palette: PaletteInterface | undefined,
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: any[]) => void,
  setEdges: (edges: any[]) => void,
  setViews: (views: any[]) => void,
  after?: () => void,
  _opts?: { defaultPosition?: FallbackPosFn }, // ya no se usa grid salvo último fallback
) {
  const lastFingerRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!doc) return;

    // evita rehidratar sin cambios relevantes
    const finger = `${doc.updatedAt ?? ''}|${doc.nodes.length}|${doc.edges.length}`;
    if (lastFingerRef.current === finger) return;
    lastFingerRef.current = finger;

    // 1) meta de nodos (size, flags, pos fija si existe)
    type Meta = {
      id: string;
      kind?: string;
      name?: string;
      errors?: any;
      warns?: any;
      props?: any;
      isBg: boolean;
      w: number;
      h: number;
      style: React.CSSProperties;
      className: string;
      hasPos: boolean;
      pos?: { x: number; y: number };
      idx: number;
    };

    const metas: Meta[] = doc.nodes.map((n: NodeData, idx) => {
      const def = findNodeType(n.kind!, palette);
      const defSize = def?.nodeSize?.({ props: (n as any).props ?? {} });
      const isBg = !!def?.isBackground?.();
      const w = typeof n.width === 'number' ? n.width : (defSize?.width ?? DEFAULT_W);
      const h = typeof n.height === 'number' ? n.height : (defSize?.height ?? DEFAULT_H);
      const style: React.CSSProperties = { width: w, height: h, zIndex: isBg ? 0 : 3 } as any;

      const hasPos = !!(n.position && Number.isFinite(n.position.x) && Number.isFinite(n.position.y));
      return {
        id: n.id,
        kind: n.kind,
        name: n.name,
        errors: n.errors,
        warns: n.warns,
        props: n.props ?? {},
        isBg,
        w,
        h,
        style,
        className: isBg ? 'c4-node c4-node--bg' : 'c4-node',
        hasPos,
        pos: hasPos ? { x: n.position!.x, y: n.position!.y } : undefined,
        idx,
      };
    });

    // 2) grafo dirigido y diccionarios de vecinos
    const byId = new Map(metas.map((m) => [m.id, m]));
    const out = new Map<string, string[]>(metas.map((m) => [m.id, []]));
    const inc = new Map<string, string[]>(metas.map((m) => [m.id, []]));
    const dir: Array<{ u: string; v: string }> = [];
    for (const e of doc.edges as DiagramEdge[]) {
      if (!byId.has(e.source) || !byId.has(e.target)) continue;
      out.get(e.source)!.push(e.target);
      inc.get(e.target)!.push(e.source);
      dir.push({ u: e.source, v: e.target });
    }

    // 3) columnas (ranks); anclar según X de nodos con posición
    const fixedX = new Map<string, number>();
    for (const m of metas) if (m.hasPos) fixedX.set(m.id, m.pos!.x);
    const ranks = computeRanks(
      metas.map((m) => m.id),
      dir,
      fixedX.size ? fixedX : null,
    );

    const minRank = Math.min(...Array.from(ranks.values()));
    const xFor = (r: number) => PAD_X + (r - minRank) * COL_X_GAP;

    // 4) colocación por columnas L→R
    //    - mapa con Y ya decidido por id (para padres colocados)
    const placedY = new Map<string, number>();

    //    - slots ocupados por columna (para evitar solapes)
    const occByCol = new Map<number, Slot[]>();

    // orden de columnas ascendente
    const cols = Array.from(new Set(Array.from(ranks.values()))).sort((a, b) => a - b);

    for (const col of cols) {
      const nodesInCol = metas
        .filter((m) => ranks.get(m.id) === col)
        // orden estable: primero con Y fija, luego por idx
        .sort((a, b) => (a.hasPos === b.hasPos ? a.idx - b.idx : a.hasPos ? -1 : 1));

      const occ = occByCol.get(col) ?? [];
      occByCol.set(col, occ);

      // 4.1. asentar los que traen Y fija
      for (const m of nodesInCol) {
        if (!m.hasPos) continue;
        placedY.set(m.id, m.pos!.y);
        occ.push({ y: m.pos!.y, h: m.h });
      }
      occ.sort((a, b) => a.y - b.y);

      // 4.2. colocar el resto usando padres ya colocados (o hijos con Y fija)
      for (const m of nodesInCol) {
        if (m.hasPos) continue;

        const parents = inc.get(m.id) ?? [];
        const children = out.get(m.id) ?? [];

        const parentsPlacedY = parents.map((pid) => placedY.get(pid)).filter((y): y is number => typeof y === 'number');

        let desiredY: number;
        if (parentsPlacedY.length) {
          desiredY = parentsPlacedY.reduce((a, b) => a + b, 0) / parentsPlacedY.length;
        } else {
          // mirar hijos con Y fija (del JSON) si existen
          const childrenFixedY = children
            .map((cid) => byId.get(cid)!)
            .filter((cm) => cm.hasPos)
            .map((cm) => cm.pos!.y);
          if (childrenFixedY.length) {
            desiredY = childrenFixedY.reduce((a, b) => a + b, 0) / childrenFixedY.length;
          } else {
            // último recurso: packing estable por índice
            desiredY = PAD_Y + m.idx * (DEFAULT_H + ROW_Y_GAP) * 0.5;
          }
        }

        const y = findFreeYNear(
          Math.round(desiredY),
          m.h,
          occ,
          Math.max(10, Math.floor(ROW_Y_GAP / 2)),
          300,
          COLLISION_PAD,
        );
        placedY.set(m.id, y);
        occ.push({ y, h: m.h });
        occ.sort((a, b) => a.y - b.y);
      }
    }

    // 5) construir rfNodes con posiciones finales
    const rfNodes = metas.map((m) => {
      const r = ranks.get(m.id)!;
      const finalX = m.hasPos ? m.pos!.x : xFor(r);
      const finalY = m.hasPos ? m.pos!.y : (placedY.get(m.id) ?? PAD_Y);
      const original = nodes.find((oe) => oe.id === m.id);
      return {
        id: m.id,
        type: 'c4',
        data: {
          id: m.id,
          kind: m.kind,
          name: m.name,
          errors: m.errors,
          warns: m.warns,
          props: m.props,
        },
        position: { x: finalX, y: finalY },
        selected: !!original?.selected,
        style: m.style,
        className: m.isBg ? 'c4-node c4-node--bg' : 'c4-node',
        draggable: true,
        selectable: true,
      };
    });

    // 6) edges tal cual
    const rfEdges = (doc.edges as DiagramEdge[]).map((e) => {
      const original = edges.find((oe) => oe.id === e.id);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        selectable: true,
        type: 'c4',
        selected: !!original?.selected,
        data: {
          kind: e.kind,
          technology: e.technology,
          description: e.description,
        },
      };
    });

    setNodes(rfNodes);
    setEdges(rfEdges);
    setViews(doc.views || []);
    if (after) requestAnimationFrame(() => after());
  }, [doc, palette, setNodes, setEdges, setViews, after]);
}
