// layoutElk.ts
import type { Edge, Node, XYPosition } from 'reactflow';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge, LayoutOptions } from 'elkjs';

const elk = new ELK();

export type ElkDirection = 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';

type LayoutArgs = {
  nodes: Node[];
  edges: Edge[];
  direction?: ElkDirection; // 'RIGHT' (L→R) o 'DOWN' (T→B)
  spacing?: { nodeNode?: number; nodeNodeBetweenLayers?: number; edgeNode?: number };
  defaults?: { width: number; height: number };
};

/**
 * Aplica elk.layered y devuelve nodos con position x/y actualizados.
 * No toca las edges (RF recalcula rutas).
 */
export async function layoutWithElk({
  nodes,
  edges,
  direction = 'RIGHT',
  spacing,
  defaults = { width: 180, height: 100 },
}: LayoutArgs): Promise<{ nodes: Node[]; edges: Edge[] }> {
  // 1) Construir grafo ELK
  const elkNodes: ElkNode[] = nodes.map((n) => ({
    id: n.id,
    width: (n.width as number) ?? ((n as any).measured?.width as number) ?? (n.style as any)?.width ?? defaults.width,
    height:
      (n.height as number) ?? ((n as any).measured?.height as number) ?? (n.style as any)?.height ?? defaults.height,
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

  const layoutOptions: LayoutOptions = {
    'elk.algorithm': 'layered',
    'elk.direction': direction, // 'RIGHT' | 'DOWN' | ...
    'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing?.nodeNodeBetweenLayers ?? 80),
    'elk.spacing.nodeNode': String(spacing?.nodeNode ?? 40),
    'elk.spacing.edgeNode': String(spacing?.edgeNode ?? 20),
    // Opcionales útiles:
    'elk.layered.crossingMinimization.semiInteractive': 'true',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  };

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions,
    children: elkNodes,
    edges: elkEdges,
  };

  // 2) Ejecutar layout
  const res = await elk.layout(elkGraph);

  // 3) Mapear posiciones devueltas a los nodos de React Flow
  const posById = new Map<string, XYPosition>();
  res.children?.forEach((c) => {
    posById.set(c.id!, { x: c.x ?? 0, y: c.y ?? 0 });
  });

  const laidOutNodes = nodes.map((n) => {
    const p = posById.get(n.id);
    return p ? { ...n, position: p } : n;
  });

  return { nodes: laidOutNodes, edges };
}
