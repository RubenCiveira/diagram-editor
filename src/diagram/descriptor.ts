import { DiagramElementType } from '../palette/DiagramElementType';
import { DiagramEdge, DiagramModel, DiagramNode } from './model';

export class BBox {
  public readonly x: number;
  public readonly y: number;
  public readonly w: number;
  public readonly h: number;
  public constructor(box: { x: number; y: number; w: number; h: number }) {
    this.x = box.x;
    this.y = box.y;
    this.w = box.w;
    this.h = box.h;
  }

  public rectsIntersect(b: BBox): boolean {
    const a = this;
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }
}

export class DiagramDescriptor {
  public readonly nodes: NodeDescriptor[];
  private readonly keys: { [k: string]: NodeDescriptor };
  private readonly ELEMENT_KIND_MAP: any;

  public constructor(
    public readonly doc: DiagramModel,
    palette: DiagramElementType[],
  ) {
    this.ELEMENT_KIND_MAP = {};
    palette.forEach((p) => {
      this.ELEMENT_KIND_MAP[p.kind] = p;
    });
    this.nodes = doc.nodes.map((n) => new NodeDescriptor(n.id, n, this.ELEMENT_KIND_MAP));
    this.keys = Object.fromEntries(this.nodes.map((t) => [t.id, t]));
    const overlaps = computeNoteOverlaps(this);
    this.nodes.forEach((n) => {
      const nodeActors = [] as any[];
      const actors = findUpstreamActors(this.doc, this.ELEMENT_KIND_MAP, n.id);
      actors.forEach((ac) => {
        const actorDescriptor = this.findNode(ac.id);
        if (actorDescriptor) {
          nodeActors.push(actorDescriptor);
        }
      });
      const outgoingLateral = doc.edges.filter((e) => e.source === n.id && !isParentChild(e));
      const incomingLateral = doc.edges.filter((e) => e.target === n.id && !isParentChild(e));
      const parentEdges = doc.edges.filter((e) => isParentChild(e) && e.target === n.id);
      const childEdges = doc.edges.filter((e) => isParentChild(e) && e.source === n.id);

      const depsList = outgoingLateral.map((e) => this.keys[e.target]);
      const dependentsList = incomingLateral.map((e) => this.keys[e.source]);
      const parentsList = parentEdges.map((e) => this.keys[e.source]);
      const childrenList = childEdges.map((e) => this.keys[e.target]);

      n.bind({
        overlaps: overlaps,
        actors: nodeActors,
        incomig: dependentsList,
        outgoing: depsList,
        childs: childrenList,
        parents: parentsList,
      });
    });
  }

  public actors(): NodeDescriptor[] {
    return this.nodes.filter((n) => n.category() == 'actor');
  }

  public actorsByGroup(): Map<DiagramElementType, NodeDescriptor[]> {
    const map = new Map();
    this.actors().forEach((n) => {
      const t = n.typeDef();
      if (!map.has(t)) {
        map.set(t, []);
      }
      map.get(t).push(n);
    });
    return map;
    // return Object.fromEntries(this.actors().map((t) => [t.typeDef().kind, t]));
  }

  public notes(): NodeDescriptor[] {
    return this.nodes.filter((n) => n.category() == 'note');
  }

  public notesByGroup(): Map<DiagramElementType, NodeDescriptor[]> {
    const map = new Map();
    this.notes().forEach((n) => {
      const t = n.typeDef();
      if (!map.has(t)) {
        map.set(t, []);
      }
      map.get(t).push(n);
    });
    return map;
    // return Object.fromEntries(this.notes().map((t) => [t.typeDef(), t]));
  }

  public components(): NodeDescriptor[] {
    return this.nodes.filter((n) => n.category() == 'component');
  }

  public componentsByGroup(): Map<DiagramElementType, NodeDescriptor[]> {
    const map = new Map();
    this.components().forEach((n) => {
      const t = n.typeDef();
      if (!map.has(t)) {
        map.set(t, []);
      }
      map.get(t).push(n);
    });
    return map;
    // return Object.fromEntries(this.components().map((t) => [t.typeDef(), t]));
  }

  public findNode(is: string): NodeDescriptor | null {
    return this.keys[is] || null;
  }
}

export class NodeDescriptor {
  private maps = null as any;
  private nodeActors: NodeDescriptor[] = [];
  private incoming: NodeDescriptor[] = [];
  private outgoing: NodeDescriptor[] = [];
  private parents: NodeDescriptor[] = [];
  private childs: NodeDescriptor[] = [];
  public constructor(
    public readonly id: string,
    public readonly node: DiagramNode,
    private readonly ELEMENT_KIND_MAP: any,
  ) {}

  bind(val: {
    overlaps: any;
    actors: NodeDescriptor[];
    incomig: NodeDescriptor[];
    outgoing: NodeDescriptor[];
    parents: NodeDescriptor[];
    childs: NodeDescriptor[];
  }) {
    this.maps = val.overlaps;
    this.nodeActors = val.actors;
    this.incoming = val.incomig;
    this.outgoing = val.outgoing;
    this.parents = val.parents;
    this.childs = val.childs;
  }

  public incomingDependecies(): NodeDescriptor[] {
    return this.incoming;
  }

  public outgoingDependencies(): NodeDescriptor[] {
    return this.outgoing;
  }

  public childrenNodes(): NodeDescriptor[] {
    return this.childs;
  }

  public parentNodes(): NodeDescriptor[] {
    return this.parents;
  }

  public actors(): NodeDescriptor[] {
    return this.nodeActors;
  }

  public nodesBelow(): NodeDescriptor[] {
    return this.maps.nodesToNotes.get(this.id) ?? [];
  }

  public nodesAbove(): NodeDescriptor[] {
    return this.maps.notesToNodes.get(this.id) ?? [];
  }

  public category() {
    return this.ELEMENT_KIND_MAP[this.node.kind]?.category?.() ?? ('component' as any);
  }

  public order(): number {
    return this.typeDef()?.exportOrder?.() ?? 100;
  }

  public compareTo(b: NodeDescriptor): number {
    return this.label().toLocaleLowerCase().localeCompare(b.label().toLocaleLowerCase());
  }
  public label(): string {
    const def = this.ELEMENT_KIND_MAP[this.node.kind];
    const props = (this.node as any).props ?? {};
    if (def?.label) return def.label({ name: this.node.name, props });
    return this.node.name ?? this.node.id;
  }

  public description(): string {
    const p = ((this.node as any).props ?? {}) as Record<string, any>;
    return p.description ?? p.descripcion ?? p.desc ?? '';
  }

  public anchorId(): string {
    return `node-${this.node.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  }

  public typeDef(): DiagramElementType {
    return this.ELEMENT_KIND_MAP[this.node.kind];
  }

  public typeTitle(): string {
    return this.ELEMENT_KIND_MAP[this.node.kind]?.title ?? this.node.kind;
  }

  public properties(): any {
    return (this.node as any).props ?? {};
  }

  public getBBox(): BBox {
    const { w, h } = this.sizeFromType();
    const x = Number((this.node as any).position?.x || 0);
    const y = Number((this.node as any).position?.y || 0);
    return new BBox({ x, y, w, h });
  }

  private sizeFromType(): { w: number; h: number } {
    // 1) preferir width/height persistidos en JSON
    const w = (this.node as any).width;
    const h = (this.node as any).height;
    if (typeof w === 'number' && typeof h === 'number') return { w, h };

    // 2) usar nodeSize() del tipo si existe
    const def = this.typeDef();
    const props = (this.node as any).props ?? {};
    const s = def?.nodeSize?.({ props });
    if (s && typeof s.width === 'number' && typeof s.height === 'number') return { w: s.width, h: s.height };

    // 3) fallback: notas grandes, resto estandar
    if (def?.isBackground?.()) return { w: 320, h: 220 };
    return { w: 96, h: 96 };
  }
}

function computeNoteOverlaps(doc: DiagramDescriptor): {
  nodesToNotes: Map<string, NodeDescriptor[]>;
  notesToNodes: Map<string, NodeDescriptor[]>;
} {
  const notes = doc.nodes.filter((n) => n.category() === 'note');
  const others = doc.nodes.filter((n) => n.category() !== 'note');

  const notesBBox = new Map<string, BBox>();
  for (const note of notes) notesBBox.set(note.id, note.getBBox());

  const nodesToNotes = new Map<string, NodeDescriptor[]>();
  const notesToNodes = new Map<string, NodeDescriptor[]>();

  for (const n of others) {
    const nb = n.getBBox();
    for (const note of notes) {
      const bn = notesBBox.get(note.id)!;
      if (nb.rectsIntersect(bn)) {
        const a = nodesToNotes.get(n.id) ?? [];
        a.push(note);
        nodesToNotes.set(n.id, a);

        const b = notesToNodes.get(note.id) ?? [];
        b.push(n);
        notesToNodes.set(note.id, b);
      }
    }
  }
  return { nodesToNotes, notesToNodes };
}

function isParentChild(e: DiagramEdge): boolean {
  if (e.kind) return e.kind === 'parentChild';
  return e.sourceHandle === 'children' && e.targetHandle === 'parent';
}

function findUpstreamActors(doc: DiagramModel, ELEMENT_KIND_MAP: any, startNodeId: string): DiagramNode[] {
  const result: DiagramNode[] = [];
  const visited = new Set<string>();
  const nodeById = new Map<string, DiagramNode>(doc.nodes.map((n) => [n.id, n]));

  function categoryOf(n: DiagramNode): 'actor' | 'component' | 'note' {
    return (ELEMENT_KIND_MAP[n.kind]?.category?.() ?? 'component') as any;
  }

  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const incomings = doc.edges.filter((e) => e.target === nodeId && !isParentChild(e)); // solo laterales
    for (const e of incomings) {
      const src = nodeById.get(e.source);
      if (!src) continue;
      const cat = categoryOf(src);
      if (cat === 'actor') {
        result.push(src);
        continue; // no seguimos más arriba desde actores
      }
      // notas y componentes: seguimos subiendo
      dfs(src.id);
    }
  }

  dfs(startNodeId);

  // deduplicar
  const seen = new Set<string>();
  return result.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
}
