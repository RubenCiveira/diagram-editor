import React from 'react';
import { PaletteInterface } from '../palette';
import { FileStorage, Storage } from '../storage/Repository';

export type AppContextValue = {
  currentFile?: FileStorage;
  repository?: Storage;
  palette?: PaletteInterface;
};

export const AppContext = React.createContext<AppContextValue>({});
