import React from 'react';
import { DiagramRender } from '../render';

export type FromHandle = 'right' | 'children';

export type DiagramUIContextValue = {
  openPalette?: () => void;
  openPaletteFromPlus?: (sourceNodeId: string, from: FromHandle) => void;
  design?: boolean;
  readOnly?: boolean;
  // openEditorById?: (id: string) => void;
  render?: DiagramRender
};

export const DiagramUIContext = React.createContext<DiagramUIContextValue>({});
