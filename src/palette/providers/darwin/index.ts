import { PaletteInterface } from '../..';
import { ExportDetails } from './actions/ExportDetail';
import { CopyToClipboard } from './actions/CopyToClipboard';
import { ValidateNoUsua } from './validators/ValidateNoUsua';
import { DARWIN_NODES } from './nodes';
import { DialogRender } from '../../../dialog/DialogRender';

const dialog = new DialogRender();

export const DARWIN_PALETTE = {
  actions: [new ExportDetails(dialog), new CopyToClipboard() ],
  nodes: DARWIN_NODES,
  validators: [ValidateNoUsua],
} as PaletteInterface;
