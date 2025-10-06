import { Handle, Position, useStore } from 'reactflow';
import React, { useMemo } from 'react';
import { DiagramUIContext } from '../../DiagramUIContext';
import { Plus } from 'lucide-react';
import OutHandle from './OutHandle';
import { DiagramNodeIntance } from '../../../../palette/DiagramElementType';

export default function AddHandle({ id, node }: { id: string; node: DiagramNodeIntance }) {
  const typeDef = node?.type;
  const acceptsOut = typeDef?.acceptsOutgoing?.() ?? true;
  const { openPaletteFromPlus,design } = React.useContext(DiagramUIContext);

  const edges = useStore((s) => s.edges);
  const hasOutgoing = useMemo(() => edges?.some((e) => e.source === node.node.id), [edges, node?.node?.id]);

  return (
      <>
        {acceptsOut && hasOutgoing && (
          <div
            style={{
              visibility: design ? 'visible' : 'hidden',
            }}
          >
            <OutHandle id={id} node={node} />
          </div>
        )}
  
        {design && acceptsOut && !hasOutgoing && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: -26,
                width: 16,
                height: 0,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: 16,
                  height: 0,
                  borderTop: '1px dashed #94a3b8',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <Handle
                type="source"
                position={Position.Right}
                onClick={() => openPaletteFromPlus?.(node.node.id, 'right')}
                id={id}
                className="hidden-handler"
                style={{
                  zIndex: 11,
                  cursor: 'grab',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: -18,
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#ffffff',
                  border: '2px solid rgb(126, 129, 134)',
                  boxShadow: '0 1px 3px rgba(0,0,0,.10)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
                aria-hidden
              >
                <Plus size={12} />
              </div>
            </div>
          </>
        )}
      </>
    )
}