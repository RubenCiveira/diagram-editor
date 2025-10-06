import React from 'react';
import { Handle, Position } from 'reactflow';
import { DiagramUIContext } from '../../DiagramUIContext';
import type { DiagramNodeIntance } from '../../../../palette/DiagramElementType';

export default function ParentHandle({ id, node }: { id: string; node: DiagramNodeIntance }) {
  const typeDef = node.type;
  const acceptParen = typeDef?.acceptsParents?.() ?? false;
  const { design } = React.useContext(DiagramUIContext);

  return (
    acceptParen && (
      <div
        style={{
          visibility: design ? 'visible' : 'hidden',
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          id={id}
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: -8,
            width: 14,
            height: 14,
            borderRadius: 4,
            background: '#ffffff',
            border: '2px solid #0ea5e9',
            boxShadow: '0 1px 2px rgba(0,0,0,.08)',
            zIndex: 9,
            cursor: 'copy',
          }}
        />
      </div>
    )
  );
}
