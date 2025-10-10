import { Edge, Node } from 'reactflow';
import { z } from 'zod';

/* ============================================================================
 * Tipos de dominio
 * ==========================================================================*/
export type EditorMode = 'design' | 'edit' | 'readonly';

export type ElementKind = string;

/** Punto en el lienzo */
export type Position = { x: number; y: number };

/** Nodo serializado (datos de dominio) */
export type DiagramNode = {
  id: string;
  kind: ElementKind;
  name?: string;
  props?: Record<string, any>;
  position: Position;
  errors?: string[];
  warns?: string[];
  /** Tamaño persistido (si el usuario redimensionó el nodo). Opcional para compat. */
  width?: number;
  height?: number;
};

/** Tipos de arista soportados en el modelo */
export type EdgeKind = 'lateral' | 'parentChild';

/** Arista serializada */
export type DiagramEdge = {
  id: string;
  source: string;
  target: string;

  /** Id del handle de origen (p.ej. 'out', 'children') */
  sourceHandle?: string;
  /** Id del handle de destino (p.ej. 'in', 'parent') */
  targetHandle?: string;

  /** Conveniencia: tipo lógico de conexión */
  kind?: EdgeKind;

  /** Campos opcionales de negocio/documentación */
  props?: Record<string, any>;
};

export type DiagramView = {
  id: string;
  name: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
  includeNodeIds: string[];
  includeTypesIds: string[];
};

export type DiagramModel = {
  version: string;
  createdAt?: string;
  updatedAt?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  views: DiagramView[];
};

export class RealtimeDiagram {
  public constructor(
    private readonly setNodes: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>,
    private readonly setEdges: React.Dispatch<React.SetStateAction<Edge<any>[]>>,
  ) {}
  update(node: DiagramNode | DiagramEdge, name: string, props: any) {
    if (this.isDiagramEdge(node)) {
      this.setEdges((ns: any[]) =>
        ns.map((n) => (n.id === node.id ? { ...n, data: { ...(n.data as DiagramEdge), props: props } } : n)),
      );
    } else {
      this.setNodes((ns: any[]) =>
        ns.map((n) =>
          n.id === node.id ? { ...n, data: { ...(n.data as DiagramNode), name: name, props: props } } : n,
        ),
      );
    }
  }

  // Type guard: ¿es una arista?
  private isDiagramEdge(x: DiagramNode | DiagramEdge): x is DiagramEdge {
    return 'source' in x && 'target' in x;
  }
}

/* ============================================================================
 * Zod schemas (tolerantes con campos opcionales)
 * ==========================================================================*/

const ZPoint = z.object({ x: z.number(), y: z.number() });

export const ZDiagramNode = z.object({
  id: z.string(),
  // Usamos string para ser tolerantes con nuevos tipos (ElementKind es más estricto en TS)
  kind: z.string(),
  name: z.string().optional(),
  props: z.record(z.any()).optional(),
  position: ZPoint.optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const ZDiagramEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  kind: z.enum(['lateral', 'parentChild']).optional(),
  description: z.string().optional(),
  technology: z.string().optional(),
});

export const ZDiagramView = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  includeNodeIds: z.array(z.string()),
  includeTypesIds: z.array(z.string()),
});

export const ZDiagramModel = z.object({
  version: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  nodes: z.array(ZDiagramNode),
  edges: z.array(ZDiagramEdge),
  views: z.array(ZDiagramView).optional(),
});

/**
 * Intenta parsear un objeto (ya deserializado) a DiagramModel.
 * Devuelve { ok: true, data } o { ok: false, error }.
 */
export function tryParseDiagramModel(input: unknown): { ok: true; data: DiagramModel } | { ok: false; error: string } {
  try {
    const parsed = ZDiagramModel.safeParse(input);
    if (parsed.success) return { ok: true, data: parsed.data as DiagramModel };
    return { ok: false, error: parsed.error.message };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
