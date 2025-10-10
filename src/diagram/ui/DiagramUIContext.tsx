import React from 'react';
import { Edge, Node } from 'reactflow';

export type FromHandle = 'right' | 'children';

export type DiagramUIContextValue = {
  openPalette?: () => void;
  openPaletteFromPlus?: (sourceNodeId: string, from: FromHandle) => void;
  design?: boolean;
  readOnly?: boolean;
  setNodes?: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>;
  setEdges?: React.Dispatch<React.SetStateAction<Edge<any>[]>>;
};

export const DiagramUIContext = React.createContext<DiagramUIContextValue>({});
