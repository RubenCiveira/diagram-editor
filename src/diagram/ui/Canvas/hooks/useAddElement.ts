import * as React from 'react';
import type { Node, XYPosition } from 'reactflow';
import type { DiagramNode } from '../../..';
import { findNodeType, PaletteInterface } from '../../../../palette';

const uid = () => Math.random().toString(36).slice(2, 10);

export type AddOptions = {
  offset?: { dx?: number; dy?: number };
};

type Helpers = {
  centerOfViewport: () => XYPosition;
};

export function useAddElement(
  palette: PaletteInterface | undefined,
  setNodes: (updater: any) => void,
  helpers: Helpers,
) {
  return React.useCallback(
    (kind: DiagramNode['kind'], opts?: AddOptions): Node => {
      const t = ( palette?.note?.kind && palette?.note?.kind === kind) ? palette?.note : findNodeType(kind, palette)!;
      const id = uid();
      const defProps = t.defaultProps() as any;
      const baseSize = t?.nodeSize?.({ props: defProps }) ?? { width: 96, height: 96 };
      const zIndex = t?.isBackground?.() ? 0 : 1;

      const panePos = helpers.centerOfViewport();

      const dx = opts?.offset?.dx ?? 12;
      const dy = opts?.offset?.dy ?? 12;
      const position = { x: panePos.x + dx, y: panePos.y + dy };

      const newNode = {
          id,
          position,
          data: {
            id,
            kind,
            name: `${t.title} ${id.slice(0, 4)}`,
            props: defProps,
          } as DiagramNode,
          type: 'c4',
          style: { width: baseSize.width, height: baseSize.height, zIndex },
          zIndex,
        };

      setNodes((ns: any[]) =>
        ns.concat(newNode),
      );

      return newNode;
    },
    [setNodes, helpers],
  );
}
