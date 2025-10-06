import { useCallback, useMemo, useState } from 'react';
import type { DiagramNode } from '../../..';
import { findNodeType, PaletteInterface } from '../../../../palette';

export function useEditNode(nodes: any[], palette: PaletteInterface | undefined, setNodes: (updater: any) => void) {
  const [open, setOpen] = useState(false);
  const [nodeId, setNodeId] = useState<string | null>(null);

  const currentNode: DiagramNode | null = useMemo(() => {
    if (!nodeId) return null;
    const n: any = nodes.find((nn: any) => nn.id === nodeId);
    return n?.data ?? null;
  }, [nodeId, nodes]);

  const currentType = findNodeType(currentNode?.kind!, palette?.nodes);

  const onNodeDoubleClick = useCallback((_e: any, node: any) => {
    setNodeId(node.id);
    setOpen(true);
  }, []);

  const onCancel = useCallback(() => {
    setOpen(false);
    setNodeId(null);
  }, []);

  const onSave = useCallback(
    (updated: { name: string; props: Record<string, any> }) => {
      if (!nodeId) return;
      setNodes((ns: any[]) =>
        ns.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...(n.data as DiagramNode), name: updated.name, props: updated.props } }
            : n,
        ),
      );
      setOpen(false);
      setNodeId(null);
    },
    [nodeId, setNodes],
  );

  return { open, currentNode, currentType, onNodeDoubleClick, onCancel, onSave };
}
