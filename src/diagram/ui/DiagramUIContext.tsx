import React from 'react';
import { Node } from 'reactflow';

export type FromHandle = 'right' | 'children';

export type DiagramUIContextValue = {
  openPalette?: () => void;
  openPaletteFromPlus?: (sourceNodeId: string, from: FromHandle) => void;
  design?: boolean;
  readOnly?: boolean;
  setNodes?: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>;
};

export const DiagramUIContext = React.createContext<DiagramUIContextValue>({});
