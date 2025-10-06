import React, { isValidElement, cloneElement, useMemo, useEffect, useRef } from 'react';
import { NodeProps, useStore, useUpdateNodeInternals } from 'reactflow';
import { RealtimeDiagram, type DiagramNode } from '../..';
import { DiagramUIContext } from '../DiagramUIContext';
import InHandle from './parts/InHandle';
import OutHandle from './parts/OutHandle';
import AddHandle from './parts/AddHandle';
import ChildHandle from './parts/ChildHandle';
import ParentHandle from './parts/ParentHandle';
import ResizeHandle from './parts/ResizeHandle';
import ErrorInfo from './parts/ErrorInfo';
import WarnInfo from './parts/WarnInfo';
import { findNodeType, useFindNodeInstance } from '../../../palette';
import { AppContext } from '../../../app/AppContext';

const DEFAULT_SQUARE = { width: '96px', height: '96px' };

export default function GenericNode({ data, selected }: NodeProps<DiagramNode>) {
  const context = React.useContext(AppContext);
  const { setNodes } = React.useContext(DiagramUIContext);
  const typeDef = data?.kind ? findNodeType(data.kind, context?.palette?.nodes) : undefined;
  const props = (data as any).props ?? {};
  const label = typeDef ? typeDef.label({ name: data.name, props }) : (data.name ?? 'Elemento');

  const baseSize = typeDef?.nodeSize?.({ props }) ?? DEFAULT_SQUARE;

  const iconNode = (() => {
    const icon = typeDef?.nodeIcon?.(props);
    return isValidElement(icon) ? icon : <div />;
  })();

  const acceptChild = typeDef?.acceptsChilds?.() ?? false;
  const acceptParen = typeDef?.acceptsParents?.() ?? false;
  const resizable = typeDef?.isResizable?.() ?? false;

  const findNodeInstance = useFindNodeInstance();
  const edges = useStore((s) => s.edges);
  const hasOutgoing = useMemo(() => edges?.some((e) => e.source === data.id), [edges, data?.id]);

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(data.id);
  }, [data.id, hasOutgoing, resizable, acceptChild, acceptParen, updateNodeInternals]);

  const onDbl = (e: React.MouseEvent) => {
    e.stopPropagation();
    typeDef?.open(data.props, data!, new RealtimeDiagram(setNodes!));
  };

  const conent = (
    <>
      {iconNode}
      <ErrorInfo node={data} />
      <WarnInfo node={data} />
    </>
  );

  const base = typeDef?.renderShape?.(props, conent) ?? (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 14,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {conent}
    </div>
  );
  const domRef = useRef<HTMLElement | null>(null);
  const shape = isValidElement(base)
    ? cloneElement(
        base as React.ReactElement,
        {
          ref: (el: HTMLElement | null) => (domRef.current = el),
          className: [(base as any).props.className, 'shape'].filter(Boolean).join(' '),
        } as any,
      )
    : base;

  useEffect(() => {
    domRef.current?.classList.add('shape--new');
  }, []);

  if (resizable) {
    baseSize.width = '100%';
    baseSize.height = '100%';
  }

  const node = findNodeInstance(data);

  const containerStyle: React.CSSProperties = resizable
    ? {
        display: 'inline-flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 2,
      }
    : { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: 2 };

  return (
    <div onDoubleClick={onDbl} style={containerStyle}>
      <ResizeHandle selected={selected} node={node} />
      <div
        style={{
          position: 'relative',
          width: baseSize.width,
          height: baseSize.height,
          overflow: 'visible',
          paddingBottom: 10,
        }}
      >
        <AddHandle id="out-new" node={node} />
        <InHandle id="in" node={node} />
        <OutHandle id="out" node={node} />
        <ChildHandle id="children" node={node} />
        <ParentHandle id="parent" node={node} />
        {shape}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 16,
          lineHeight: 1.2,
          width: baseSize.width,
          textAlign: 'center',
          color: 'rgb(65, 66, 68)',
          wordBreak: 'break-word',
        }}
      >
        {label}
      </div>
    </div>
  );
}
