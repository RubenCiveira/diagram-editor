import { PaletteInterface } from '../..';
import { ExportDetails } from './actions/ExportDetail';
import { CopyToClipboard } from './actions/CopyToClipboard';
import { ValidateNoUsua } from './validators/ValidateNoUsua';
import { DARWIN_NODES } from './nodes';

export const DARWIN_PALETTE = {
  actions: [ExportDetails, CopyToClipboard],
  nodes: DARWIN_NODES,
  validators: [ValidateNoUsua],
} as PaletteInterface;
