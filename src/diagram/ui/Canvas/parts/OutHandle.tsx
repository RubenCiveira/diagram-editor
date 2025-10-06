import React from 'react';
import { Handle, Position } from 'reactflow';
import { DiagramUIContext } from '../../DiagramUIContext';
import type { DiagramNodeIntance } from '../../../../palette/DiagramElementType';

export default function OutHandle({ id, node }: { id: string, node: DiagramNodeIntance }) {
  const typeDef = node.type;
  const acceptsOut = typeDef?.acceptsOutgoing?.() ?? true;
  const { design } = React.useContext(DiagramUIContext);

  return (
    acceptsOut && (
      <div
        style={{
          visibility: design ? 'visible' : 'hidden',
        }}
      >
        <Handle
          type="source"
          position={Position.Right}
          id={id}
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#ffffff',
            border: '2px solid #22c55e',
            boxShadow: '0 1px 2px rgba(0,0,0,.08)',
            zIndex: 8,
          }}
        />
      </div>
    )
  );
}

