import React from 'react';
import { NodeResizer } from 'reactflow';
import { DiagramUIContext } from '../../DiagramUIContext';
import type { DiagramNodeIntance } from '../../../../palette/DiagramElementType';

export default function ResizeHandle({ node, selected }: { node: DiagramNodeIntance; selected: boolean }) {
  const typeDef = node.type;
  const resizable = typeDef?.isResizable?.() ?? false;
  const { design } = React.useContext(DiagramUIContext);

  return (
    design &&
    resizable && (
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        keepAspectRatio={false}
        lineStyle={{ border: '1px dashed #94a3b8' }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, background: '#111827' }}
      />
    )
  );
}

