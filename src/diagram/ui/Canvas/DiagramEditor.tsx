import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  useEdgesState,
  useNodesState,
  ConnectionMode,
  ConnectionLineType,
  MarkerType,
  SelectionMode,
  PanOnScrollMode,
  addEdge,
  Node,
  ReactFlowInstance,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './DiagramEditor.scss';
import { Plus, Download } from 'lucide-react';

import {
  DiagramNode,
  RealtimeDiagram,
  type DiagramModel,
  type DiagramNode as DiagramNodeData,
  type DiagramView,
  type EditorMode,
} from '../..';

import { useReactFlowFit } from './hooks/useReactFlowFit';
import { useHydrateFromJSON } from './hooks/useHydrateFromJSON';
import { useConnectValidation } from './hooks/useConnectValidation';
import { useOnConnect } from './hooks/useOnConnect';
import { useAddElement } from './hooks/useAddElement';
import { useSerialize } from './hooks/useSerialize';
import { DiagramUIContext, FromHandle } from '../DiagramUIContext';
import { usePreconnectValidation } from './hooks/usePreconnectValidation';
import { useUndoRedo } from './hooks/useUndoRedo';
import { usePasteImport } from './hooks/usePasteImport';
import { useCopySelection } from './hooks/useCopySelection';
import ViewTabs from '../ViewsToolbar/ViewTabs';
import ViewDialog from '../ViewsToolbar/ViewDialog';
import GenericEdge from './GenericEdge';
import GenericNode from './GenericNode';
import { useNestValidation } from './hooks/useNestValidation';
import { AppContext } from '../../../app/AppContext';
import { findNodeType } from '../../../palette';

const NODE_TYPES_STABLE = {
  c4: GenericNode,
} as const;

// Edge type bezier que respeta la selección
const EDGE_TYPES_STABLE = {
  c4: GenericEdge,
} as const;

export interface DiagramEditorHandle {
  serialize(): DiagramModel;
  fit(): void;
  add(kind: DiagramNodeData['kind']): string;
  createFromPalette?(kind: DiagramNodeData['kind']): string;
  addNode?(kind: DiagramNodeData['kind']): string;
  createNodeFromPalette?(kind: DiagramNodeData['kind']): string;
  getDiagram?(): DiagramModel;
  getCanva(): any;
}

type Props = {
  initialDiagram?: DiagramModel | null;
  onOpenPalette?: () => void;
  onOpenActions?: () => void;
  onUpdateDiagram?: (kind: DiagramModel) => void;
  onBusyAcquire?(callback: (release: () => void) => void, msg?: string): void;
  mode: EditorMode;
};

/* ---------- utilidades de colocación ---------- */
const DEFAULT_SQUARE = 96; // px
const DEFAULT_CIRCLE = 80; // px
const GAP_X = 80; // separación horizontal
const PADDING = 12; // margen anti-colisión

const DEFAULT_EDGE_OPTIONS = {
  type: 'c4' as const,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2.75 },
};
const CONNECTION_LINE_STYLE = { strokeWidth: 2.75 };

function kindSize(kind: string): { w: number; h: number } {
  if (kind === 'api') return { w: DEFAULT_CIRCLE, h: DEFAULT_CIRCLE };
  return { w: DEFAULT_SQUARE, h: DEFAULT_SQUARE };
}
function bboxOf(n: Node): { x: number; y: number; w: number; h: number } {
  const w = (n as any).width ?? DEFAULT_SQUARE;
  const h = (n as any).height ?? DEFAULT_SQUARE;
  return { x: n.position.x, y: n.position.y, w, h };
}
function overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return !(
    a.x + a.w + PADDING <= b.x ||
    b.x + b.w + PADDING <= a.x ||
    a.y + a.h + PADDING <= b.y ||
    b.y + b.h + PADDING <= a.y
  );
}
function findFreePosition(
  x0: number,
  y0: number,
  w: number,
  h: number,
  nodes: Node[],
  maxTries = 20,
  stepY = 36,
): { x: number; y: number } {
  const candidates: Array<{ x: number; y: number }> = [{ x: x0, y: y0 }];
  for (let i = 1; i <= maxTries; i++) {
    const dy = stepY * i;
    candidates.push({ x: x0, y: y0 + dy });
    candidates.push({ x: x0, y: y0 - dy });
  }
  const others = nodes.map(bboxOf);
  for (const c of candidates) {
    const bb = { x: c.x, y: c.y, w, h };
    if (!others.some((o) => overlap(bb, o))) return c;
  }
  return { x: x0, y: y0 };
}

function DiagramEditorImpl(
  { initialDiagram, onOpenPalette, onOpenActions, onUpdateDiagram, onBusyAcquire, mode }: Props,
  ref: React.Ref<DiagramEditorHandle>,
) {
  const [nodes, setNodes, _onNodesChange] = useNodesState([]);
  const [edges, setEdges, _onEdgesChange] = useEdgesState([]);

  const rfRef = React.useRef<ReactFlowInstance | null>(null);
  const paneRef = React.useRef<HTMLDivElement | null>(null);

  const [allNodes, setAllNodes] = React.useState<any[]>([]);
  const [allEdges, setAllEdges] = React.useState<any[]>([]);

  const [hiddenNodes, setHiddenNodes] = React.useState<string[]>([]);
  const [views, setViews] = React.useState<DiagramView[]>(() => initialDiagram?.views ?? []);
  const [currentViewId, setCurrentViewId] = React.useState<string>('');
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editingView, setEditingView] = React.useState<DiagramView | null>(null);

  const context = React.useContext(AppContext);

  React.useEffect(() => {
    const isDesign = mode === 'design' && currentViewId === '';
    const canConnect = mode === 'design' && currentViewId === '';

    setNodes(
      allNodes.map((e) => {
        // console.log("EVERY ", selectedIds );
        // if( selectedIds.includes(e.id) ) {
        //   console.log("WITH INCLUSION");
        // }
        return {
          ...e,
          hidden: hiddenNodes.includes(e.id),
          draggable: isDesign,
          connectable: canConnect,
          // selectable: true,
          // selected: selectedIds.includes(e.id),
          data: { ...e.data, uiMode: mode },
        };
      }),
    );
    setEdges(allEdges.map((e) => ({ ...e, hidden: hiddenNodes.includes(e.source) || hiddenNodes.includes(e.target) })));
  }, [allNodes, allEdges, hiddenNodes, mode, currentViewId]);

  const { onInit: onInitFit, fit } = useReactFlowFit();

  const onInit = React.useCallback(
    (inst: ReactFlowInstance) => {
      rfRef.current = inst;
      onInitFit(inst);
    },
    [onInitFit],
  );

  const screenToFlowPosition = React.useCallback((client: { x: number; y: number }) => {
    const inst = rfRef.current as any;
    if (inst?.screenToFlowPosition) return inst.screenToFlowPosition(client);
    // fallback neutro si aún no hay instancia
    return { x: client.x, y: client.y };
  }, []);

  const centerSeedRef = React.useRef(0);

  const centerOfViewport = React.useCallback(() => {
    const rect = paneRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const clientCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const center = screenToFlowPosition(clientCenter);

    const zoom = (rfRef.current as any)?.getViewport?.().zoom ?? (rfRef.current as any)?.getZoom?.() ?? 1;

    // espiral: radio crece suave, ángulo áureo
    const i = centerSeedRef.current++;
    const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad
    const angle = i * GOLDEN;
    const rPx = 40 + 12 * Math.sqrt(i); // radio en píxeles de pantalla
    const dx = (rPx * Math.cos(angle)) / zoom;
    const dy = (rPx * Math.sin(angle)) / zoom;

    return { x: center.x + dx, y: center.y + dy };
  }, [screenToFlowPosition]);

  const addElement = useAddElement(context.palette, setAllNodes as any, { centerOfViewport });

  // createdAt persistido si el doc ya lo traía
  const createdAtRef = React.useRef<string | undefined>(undefined);
  const readOnly = mode === 'readonly';
  const isDesign = mode === 'design' && currentViewId === '';

  const { commit, undo, redo, onNodesChangeWithHistory, onEdgesChangeWithHistory } = useUndoRedo(
    nodes as any[],
    setAllNodes as any,
    edges as any[],
    setAllEdges as any,
    { limit: 100 },
  );
  useCopySelection({
    nodes: nodes as any[],
    edges: edges as any[],
    onDone: () => {
      /* opcional: toast “copiado” */
    },
    onError: (m) => alert(m),
  });
  // Atajos: Cmd/Ctrl+Z (undo) y Shift+Cmd/Ctrl+Z (redo) / Ctrl+Y (redo)
  React.useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = (t.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || (t as any).isContentEditable;
    };

    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      // Normaliza tecla
      const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      const isMac = navigator.userAgent.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (!mod) return;

      // Deshacer
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        undo();
        return;
      }

      // Rehacer (macOS: ⇧⌘Z) + soporte adicional ⌘Y
      if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        e.stopPropagation();
        redo();
        return;
      }
    };

    // ⚠️ fase de captura para priorizar este listener
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [undo, redo]);

  // ... dentro del componente DiagramEditor (después de definir refs/helpers y tener setNodes/setEdges) ...
  usePasteImport({
    palette: context?.palette,
    mode, // 'design' | 'edit' | 'readonly' (si no lo tienes, pásalo como 'design')
    setNodes: setAllNodes,
    setEdges: setAllEdges,
    helpers: { centerOfViewport, screenToFlowPosition },
    onError: (msg) => alert(msg),
    onImported: () => {
      commit();
    },
    onBusyAcquire,
    pasteOffset: { dx: 48, dy: 24 }, // desplazamiento del lote pegado
  });

  const defaultPos = (_n: any, i: any) => {
    // usa tu centerOfViewport() y distribuye en espiral alrededor
    const c = centerOfViewport(); // coords del flow
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const angle = i * GOLDEN;
    const r = 60 + 16 * Math.sqrt(i);
    return { x: c.x + r * Math.cos(angle), y: c.y + r * Math.sin(angle) };
  };

  // Hidratar al cargar (y auto-fit al final)
  useHydrateFromJSON(
    initialDiagram ?? null,
    context?.palette,
    (n) => setAllNodes(n as any),
    (e) => setAllEdges(e as any),
    (v) => setViews(v as any),
    () => {},
    { defaultPosition: defaultPos },
  );

  React.useEffect(() => {
    if (!initialDiagram) return;
    if (typeof initialDiagram.createdAt === 'string') createdAtRef.current = initialDiagram.createdAt;
    setViews(initialDiagram.views || []);
  }, [initialDiagram]);

  // Si cambiamos de vista tras estar montado, actualiza hidden (y haz fit)
  React.useEffect(() => {
    const currentView = views.find((view) => view.id == currentViewId);
    setHiddenNodes(currentView ? allNodes.map((n) => n.id).filter((n) => !currentView.includeNodeIds.includes(n)) : []);
  }, [currentViewId, views]);

  React.useEffect(() => {
    const isDesign = mode === 'design' && currentViewId === '';
    const canConnect = mode === 'design' && currentViewId === '';
    console.log('set nodes v2');
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        draggable: isDesign, // ⬅️ bloqueo real de arrastre por nodo
        connectable: canConnect, // ⬅️ opcional: anula handles para crear conexiones
        // (opcional) propagar el modo al data del nodo por si tu GenericNode lo necesita
        data: { ...n.data, uiMode: mode },
      })),
    );
  }, [mode, currentViewId, setNodes]);

  const canConnect = useConnectValidation(nodes as any[], context?.palette);
  const canNest = useNestValidation(nodes as any[], context?.palette);
  const onConnect = useOnConnect(context?.palette, setAllEdges as any, canConnect, canNest, nodes as any[]);
  const precheckConnect = usePreconnectValidation(context?.palette, nodes as any[]);

  const serialize = useSerialize(nodes as any[], edges as any[], createdAtRef.current, views as any);

  React.useEffect(() => {
    onUpdateDiagram?.(serialize());
  }, [nodes]);

  /** Estado para apertura desde “+” contextual (nodo) */
  const [pendingFrom, setPendingFrom] = React.useState<null | { sourceId: string; from: FromHandle }>(null);
  const [pendingAutoConnect, setPendingAutoConnect] = React.useState<null | {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>(null);

  /** Añadir con posicionamiento mejorado */
  const handleAdd = React.useCallback(
    (kind: DiagramNodeData['kind']) => {
      if (pendingFrom) {
        const { sourceId } = pendingFrom;
        const pre = precheckConnect(sourceId, kind);
        if (!pre.ok) {
          alert(`No se puede crear conectado: ${pre.reason}`);
          setPendingFrom(null);
          return '';
        }
      }
      const newNode = addElement(kind);
      const newId = newNode.id;
      if (pendingFrom) {
        const { sourceId, from } = pendingFrom;
        const src = (nodes as any[]).find((n) => n.id === sourceId) as Node | undefined;
        if (src) {
          const srcBB = bboxOf(src);
          const targetSize = kindSize(kind);
          const baseX = srcBB.x + (srcBB.w || DEFAULT_SQUARE) + GAP_X;
          const baseY = srcBB.y;
          const pos = findFreePosition(baseX, baseY, targetSize.w, targetSize.h, nodes as any[]);
          setAllNodes((nds: any[]) =>
            nds.map((n) => (n.id === newId ? { ...n, position: { x: pos.x, y: pos.y } } : n)),
          );
        }
        if (from === 'children') {
          setPendingAutoConnect({ source: sourceId, target: newId, sourceHandle: 'children', targetHandle: 'parent' });
        } else {
          setPendingAutoConnect({ source: sourceId, target: newId });
        }
        setAllEdges((eds: any[]) =>
          addEdge(
            {
              source: sourceId,
              target: newId,
              sourceHandle: from === 'children' ? 'parent' : 'out',
              targetHandle: from === 'children' ? 'children' : 'in',
              type: 'c4',
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2.75 },
            } as Edge,
            eds,
          ),
        );
        setPendingFrom(null);
      }

      const nodeType = findNodeType(kind, context.palette?.nodes);
      if (nodeType) {
        nodeType.open(newNode.data.props, newNode.data as DiagramNode, new RealtimeDiagram(setNodes!));
      } else {
        console.error('No info for type of the data');
      }
      return newId;
    },
    [addElement, pendingFrom, nodes, setNodes],
  );

  // Autoconexión tras crear
  React.useEffect(() => {
    if (!pendingAutoConnect) return;
    const { source, target, sourceHandle, targetHandle } = pendingAutoConnect;

    const srcExists = (nodes as any[]).some((n) => n.id === source);
    const tgtExists = (nodes as any[]).some((n) => n.id === target);
    if (!srcExists || !tgtExists) return;

    const usesVertical = sourceHandle === 'children' || targetHandle === 'parent';

    const res = usesVertical ? canNest(source, target) : canConnect(source, target);
    if (!res.ok) {
      alert(`Conexión automática cancelada: ${res.reason}`);
      setPendingAutoConnect(null);
      return;
    }

    setAllEdges((eds: any[]) =>
      addEdge(
        {
          source,
          target,
          sourceHandle,
          targetHandle,
          type: 'c4',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2.75 },
        } as Edge,
        eds,
      ),
    );
    setPendingAutoConnect(null);
  }, [nodes, canConnect, setAllEdges, pendingAutoConnect]);

  // Exponer API pública (compatibilidad con la paleta nueva)
  React.useImperativeHandle(
    ref,
    () => ({
      serialize,
      fit,
      add: handleAdd,
      createFromPalette: (kind) => handleAdd(kind),
      addNode: (kind) => handleAdd(kind),
      createNodeFromPalette: (kind) => handleAdd(kind),
      getDiagram: () => serialize(),
      getCanva: () => rfRef.current,
    }),
    [serialize, fit, handleAdd],
  );
  const createView = () => {
    setEditingView(null);
    setViewDialogOpen(true);
  };
  const editView = (v: DiagramView) => {
    setEditingView(v);
    setViewDialogOpen(true);
  };
  const deleteView = (id: string) => {
    if (!confirm('¿Eliminar la vista?')) return;
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (currentViewId === id) setCurrentViewId('');
  };

  const saveView = (view: DiagramView) => {
    setViews((prevViews) => {
      const idx = prevViews.findIndex((v) => v.id === view.id);
      if (idx >= 0) {
        // Actualizar vista existente
        const updated = [...prevViews];
        updated[idx] = view;
        return updated;
      } else {
        // Añadir nueva vista
        return [...prevViews, view];
      }
    });
    setCurrentViewId(view.id);
    setViewDialogOpen(false);
  };

  const allNodesForDialog = React.useMemo(
    () =>
      (nodes as any[]).map((n) => ({
        id: n.id,
        label: String(n?.data?.name ?? n.id),
      })),
    [nodes],
  );

  return (
    <div className="diagram-container" ref={paneRef}>
      {/* Tabs de vistas */}
      <ViewTabs
        views={views}
        currentViewId={currentViewId}
        readOnly={readOnly}
        onChangeView={setCurrentViewId}
        onCreate={createView}
        onEdit={editView}
        onDelete={deleteView}
      />

      {/* Botones flotantes */}
      {isDesign && (
        <button
          onClick={() => onOpenPalette?.()}
          aria-label="Añadir nodo"
          title="Añadir nodo"
          className="rf-floating-add"
        >
          <Plus size={18} />
        </button>
      )}

      <button
        onClick={() => onOpenActions?.()}
        aria-label="Exportar diagrama"
        title="Exportar diagrama"
        className="rf-floating-export"
      >
        <Download size={18} />
      </button>

      <DiagramUIContext.Provider
        value={{
          openPalette: onOpenPalette,
          openPaletteFromPlus: (sourceId, from) => {
            setPendingFrom({ sourceId, from });
            onOpenPalette?.();
          },
          design: isDesign,
          readOnly: readOnly,
          setNodes: setNodes,
          // render: render,
        }}
      >
        <ReactFlow
          nodesConnectable={isDesign}
          elementsSelectable={true}
          panOnDrag={false}
          panOnScroll={true}
          panOnScrollMode={PanOnScrollMode.Free}
          selectionOnDrag={true}
          selectionMode={SelectionMode.Partial}
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          nodes={nodes as any}
          edges={edges as any}
          minZoom={0.02}
          maxZoom={4}
          onNodesChange={onNodesChangeWithHistory}
          onEdgesChange={onEdgesChangeWithHistory}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES_STABLE}
          edgeTypes={EDGE_TYPES_STABLE}
          connectionMode={ConnectionMode.Strict}
          onInit={onInit}
          connectionLineType={ConnectionLineType.SimpleBezier}
          connectionLineStyle={CONNECTION_LINE_STYLE}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          edgesFocusable={true}
          edgesUpdatable={false}
        >
          <Controls
            position="bottom-right"
            showInteractive={false}
            style={{ background: 'transparent', border: 'none', boxShadow: 'none', width: 'auto', padding: 0 }}
          />
          <Background gap={16} />
        </ReactFlow>
      </DiagramUIContext.Provider>

      {/* Diálogo de creación/edición de vistas */}
      <ViewDialog
        open={viewDialogOpen}
        initial={editingView}
        allNodes={allNodesForDialog}
        onCancel={() => setViewDialogOpen(false)}
        onSave={saveView}
      />
    </div>
  );
}

const DiagramEditor = React.forwardRef(DiagramEditorImpl) as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props> & React.RefAttributes<DiagramEditorHandle>
>;
export default DiagramEditor;
