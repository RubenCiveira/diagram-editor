import React from 'react';
import { Handle, Position } from 'reactflow';
import { DiagramUIContext } from '../../DiagramUIContext';
import { DiagramNodeIntance } from '../../../../palette/DiagramElementType';

export default function InHandle({ id, node }: { id: string, node: DiagramNodeIntance }) {
    const typeDef = node?.type;
    const acceptsIn = typeDef?.acceptsIncoming?.() ?? true;
    const { design } = React.useContext(DiagramUIContext);

    return acceptsIn && (
      <div
        style={{
          visibility: design ? 'visible' : 'hidden',
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          id={id}
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14,
            height: 14,
            borderRadius: 4,
            background: '#ffffff',
            border: '2px solid #0ea5e9',
            boxShadow: '0 1px 2px rgba(0,0,0,.08)',
            zIndex: 8,
          }}
        />
      </div>
    );
}