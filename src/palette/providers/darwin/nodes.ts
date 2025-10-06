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

export const DARWIN_NODES = [
  new DarwinUser(),
  new ShellUiElement(),
  new MicroFrontElement(),
  new GatewayElement(),
  new GatewayProxyElement(),
  new OAuthProxyElement(),
  new MicroserviceElement(),
  new DatabaseElement(),
  new ExternalServiceElement(),
  new ExternalSoapElement(),
  new ExternalTransactionElement(),
  new ApiElement(),
  new NoteElement(),
] as DiagramElementType[];
