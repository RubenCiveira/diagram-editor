import React from 'react';

export type FromHandle = 'right' | 'children';

export type DiagramUIContextValue = {
  openPalette?: () => void;
  openPaletteFromPlus?: (sourceNodeId: string, from: FromHandle) => void;
  design?: boolean;
  readOnly?: boolean;
  openEditorById?: (id: string) => void;
};

export const DiagramUIContext = React.createContext<DiagramUIContextValue>({});
