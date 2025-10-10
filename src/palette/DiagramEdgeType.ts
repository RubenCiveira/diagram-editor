import { Edge, Node } from 'reactflow';
import { DiagramEdge, DiagramNode, RealtimeDiagram } from '../diagram';

export interface DiagramEdgeTypeCtx {
  source: DiagramNode;
  sourceNode: Node;
  target: DiagramNode;
  targetNode: Node;
  edge: DiagramEdge;
  connectionEdge: Edge;
  // helpers opcionales
  sourceHadle?: string; // si tus Node.data.kind viene aquí
  targetHadle?: string;
}

export interface DiagramEdgeType<T = any> {
  label?(ctx: DiagramEdgeTypeCtx): Promise<string> | string;

  precedence(ctx: DiagramEdgeTypeCtx): number;

  open(props: T, ctx: DiagramEdgeTypeCtx, diagram: RealtimeDiagram): Promise<void> | void;
}
