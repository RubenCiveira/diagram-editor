import React from 'react';
import { Handle, Position } from 'reactflow';
import { DiagramUIContext } from '../../DiagramUIContext';
import { DiagramNodeIntance } from '../../../../palette/DiagramElementType';

export default function ChildHandle({ id, node }: { id: string; node: DiagramNodeIntance }) {
  const typeDef = node?.type;
  const acceptChild = typeDef?.acceptsChilds?.() ?? false;
  const { openPaletteFromPlus, design } = React.useContext(DiagramUIContext);

  return acceptChild && (
        <div
          style={{
            visibility: design ? 'visible' : 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: -16,
              width: 16,
              height: 0,
              borderTop: '1px dashed #94a3b8',
              pointerEvents: 'none',
              zIndex: 7,
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id={id}
            onClick={() => openPaletteFromPlus?.(node.node.id, 'children')}
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: -8,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#ffffff',
              border: '2px solid #22c55e',
              boxShadow: '0 1px 2px rgba(0,0,0,.08)',
              zIndex: 9,
              cursor: 'crosshair',
            }}
          />
        </div>
      )
}