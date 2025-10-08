import React from 'react';
import { AppContext } from '../app/AppContext';
import { DiagramModel, DiagramNode } from '../diagram';
import { ActionItem } from './ActionItem';
import { DiagramElementType, DiagramNodeIntance } from './DiagramElementType';

export type DiagramValidator = (diagram: DiagramModel) => Promise<void>;

export interface PaletteInterface {
  actions: ActionItem[];
  nodes: DiagramElementType[];
  validators: DiagramValidator[];
  note?: DiagramElementType;
}

export function useFindNodeInstance() {
  return React.useCallback((node: DiagramNode): DiagramNodeIntance => {
    const context = React.useContext(AppContext);
    return {
      node: node,
      type: findNodeType(node.kind, context?.palette)!,
    };
  }, []);
}

export function findNodeType(
  kind: string,
  palette: PaletteInterface | undefined | null,
): DiagramElementType<any> | undefined {
  const nodes = palette?.nodes;
  if (palette?.note?.kind && palette?.note?.kind === kind) {
    return palette?.note;
  } else {
    const entries = nodes ? Object.fromEntries(nodes.map((t) => [t.kind, t])) : {};
    return entries[kind];
  }
}
