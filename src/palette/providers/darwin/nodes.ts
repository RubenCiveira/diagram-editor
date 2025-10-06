import { DialogRender } from '../../../dialog/DialogRender';
import { DiagramElementType } from '../../DiagramElementType';
import { ApiElement } from './nodes/api';
import { DatabaseElement } from './nodes/database';
import { ExternalServiceElement } from './nodes/external-service';
import { ExternalSoapElement } from './nodes/external-soap';
import { ExternalTransactionElement } from './nodes/external-transaction';
import { GatewayElement } from './nodes/gateway';
import { GatewayProxyElement } from './nodes/gateway-proxy';
import { MicroFrontElement } from './nodes/micro-front';
import { MicroserviceElement } from './nodes/microservice';
import { NoteElement } from './nodes/note';
import { OAuthProxyElement } from './nodes/oauth-proxy';
import { ShellUiElement } from './nodes/shell-ui';
import { DarwinUser } from './nodes/user';

const dialog = new DialogRender();

export const DARWIN_NODES = [
  new DarwinUser(dialog),
  new ShellUiElement(dialog),
  new MicroFrontElement(dialog),
  new GatewayElement(dialog),
  new GatewayProxyElement(dialog),
  new OAuthProxyElement(dialog),
  new MicroserviceElement(dialog),
  new DatabaseElement(dialog),
  new ExternalServiceElement(dialog),
  new ExternalSoapElement(dialog),
  new ExternalTransactionElement(dialog),
  new ApiElement(dialog),
  new NoteElement(dialog),
] as DiagramElementType[];
