import type { ReactNode } from 'react';
import type { DiagramModel, DiagramNode, RealtimeDiagram } from '../diagram';
import type { ElementKind } from '../diagram';

export type NodeActionContext = {};

export interface NodeActionItem {
  readonly disabled?: boolean;
  readonly title?: string;
  readonly label?: string;
  readonly icon?: ReactNode;
  readonly danger?: boolean;

  onClick(): Promise<void> | void;
}

export type NodeCategory = 'actor' | 'component' | 'note';

export type ConnectCheckResult = { ok: true } | { ok: false; reason: string };

export type FromHandle = 'out' | 'children';
export type ToHandle = 'in' | 'parent';

export type IncomingEdge = {
  source: DiagramNode;
  target: DiagramNode;
  sourceKind: ElementKind;
  sourceType: DiagramElementType;
};
export type OutgoingEdge = {
  source: DiagramNode;
  target: DiagramNode;
  targetKind: ElementKind;
  targetType: DiagramElementType;
};

export interface DiagramNodeIntance {
  node: DiagramNode;
  type: DiagramElementType;
}

export interface DiagramElementType<P = any> {
  /** Identificador lógico del tipo (kind) */
  kind: ElementKind;
  /** Título visible en paleta / export */
  title: string;

  /** Icono para la paleta */
  paletteIcon?: ReactNode;
  /** Icono para el nodo (interior) */
  nodeIcon?(props: P): ReactNode;

  open(props: P, node: DiagramNode, graph: RealtimeDiagram): Promise<void> | void;

  /** Props por defecto para nuevo nodo */
  defaultProps(): P;

  /** Etiqueta visible del nodo (en el lienzo y/o export) */
  label(input: { name?: string; props: P }): string;

  /** Categoría para export / agrupaciones */
  category(): NodeCategory;

  /** Tamaño por defecto del nodo (si no hay width/height persistido) */
  nodeSize?(input: { props: P }): { width: number; height: number };

  isResizable?(): boolean;

  /** Si el nodo es de fondo (p. ej., una nota) */
  isBackground?(): boolean;

  /** ¿Permite conexiones salientes laterales? */
  acceptsOutgoing?(): boolean;
  /** ¿Permite conexiones entrantes laterales? */
  acceptsIncoming?(): boolean;

  /** ¿Admite hijos (punto de conexión inferior)? => actuará como contenedor/boundary en C4 PlantUML */
  acceptsChilds?(): boolean;
  /** ¿Admite padres (punto de conexión superior)? */
  acceptsParents?(): boolean;

  /**
   * Valida una conexión creada desde este nodo hacia un destino.
   * Debe lanzar Error si no permite esa conexión (el editor la capturará y la cancelará).
   */
  verifyConnectTo?(to: OutgoingEdge): void;

  /**
   *
   */
  verifyConnectFrom?(from: IncomingEdge): void;

  /**
   * Valida una conexión creada desde este nodo hacia un destino.
   * Debe lanzar Error si no permite esa conexión (el editor la capturará y la cancelará).
   */
  verifyNestIntoParent?(from: IncomingEdge): void;

  /**
   *
   */
  verifyNestChild?(to: OutgoingEdge): void;

  /**
   * HTML de propiedades para informes/exportación.
   * Si no se implementa, la exportación cae a un `<pre>` con JSON de props.
   */
  reportProperties?(props: P, node: DiagramNode, doc: DiagramModel): Promise<string> | string;

  /**
   * Orden opcional para exportar (menor = antes).
   */
  exportOrder?(): number;

  renderShape?(props: P, content: ReactNode): ReactNode;
  /**
   * Render del “interior” del nodo en el lienzo (icono/forma). Si no se define,
   * se usa el render genérico por tipo (cuadrado o círculo para API).
   */
  renderNodeContent?(props: P, node: DiagramNode): ReactNode;
}
