import { Node } from 'reactflow';
import { z } from 'zod';

/* ============================================================================
 * Tipos de dominio
 * ==========================================================================*/
export type EditorMode = 'design' | 'edit' | 'readonly';

export type ElementKind =
  | 'userActor'
  | 'gateway'
  | 'api'
  | 'microservice'
  | 'microFront'
  | 'shell'
  | 'externalService'
  | 'proxyConfig'
  | 'note'
  | (string & {}); // extensible: permite tipos de nodo futuros

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
  description?: string;
  technology?: string;
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
    private readonly setNodes: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>
  ) {
  }
  update(id: string, name: string, props: any) {
    this.setNodes((ns: any[]) =>
        ns.map((n) =>
          n.id === id
            ? { ...n, data: { ...(n.data as DiagramNode), name: name, props: props } }
            : n,
        ),
      );
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

// /**
//  * Utilidad: deduce el tipo lógico de arista si faltara, a partir de los handles.
//  * parentChild = sourceHandle:'children' y targetHandle:'parent'; si no, lateral.
//  */
// export function edgeInferKind(e: DiagramEdge): EdgeKind {
//   if (e.kind) return e.kind;
//   if (e.sourceHandle === 'children' && e.targetHandle === 'parent') return 'parentChild';
//   return 'lateral';
// }
