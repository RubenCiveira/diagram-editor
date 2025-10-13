import { BaseEdge, getSimpleBezierPath, EdgeProps } from 'reactflow';

export default function GenericEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, selected } = props;

  const [edgePath] = getSimpleBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const active = props.data?.active;
  // Estilo base + resaltado si está seleccionado
  const stroke = selected ? '#111827' : (style?.stroke as string) || '#334155';
  const strokeWidth = selected ? 3.5 : (style?.strokeWidth as number) || 2.75;

  return (
    <>
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ ...style, stroke, strokeWidth }}
      interactionWidth={24} // hitbox cómodo para selección
      />
      { active===true && <circle r="10" fill="#ff0073">
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
      </circle> }
      { selected && <button>GO</button>}
      </>
  );
}

