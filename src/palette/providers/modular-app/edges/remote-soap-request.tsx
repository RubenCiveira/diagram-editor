import { RealtimeDiagram } from '../../../../diagram';
import { DialogRender } from '../../../../dialog/DialogRender';
import { DiagramEdgeType, DiagramEdgeTypeCtx } from '../../../DiagramEdgeType';
import connectionType from '../../../schemas/net/connection';
import retryType from '../../../schemas/resilence/retry';
import cacheType from '../../../schemas/resilence/cache';
import circuitType from '../../../schemas/resilence/circuit';

export type RemoteRequestProps = {
  protocol: 'http' | 'https' | 'grpc';
  basePath: string;
  version?: string;
  auth?: 'none' | 'basic' | 'oauth';
  specUrl?: string;
};

export class RemoteSoapRequest implements DiagramEdgeType<RemoteRequestProps> {
  constructor(public readonly render: DialogRender) {}

  label(_ctx: DiagramEdgeTypeCtx): string {
    return 'Noop';
  }

  precedence(ctx: DiagramEdgeTypeCtx): number {
    const validSources = ['microservice'];
    const validTargets = ['externalSoap'];
    if (validSources.includes(ctx.source.kind) && validTargets.includes(ctx.target.kind)) {
      return 1;
    } else {
      return 0;
    }
  }

  async open(props: RemoteRequestProps, ctx: DiagramEdgeTypeCtx, diagram: RealtimeDiagram): Promise<void> {
    const data = await this.render.showEdit({
      value: props,
      definition: this.definition(),
    });
    if (data.accepted) {
      diagram.update(ctx.edge, data.title, data.data);
    }
    return;
  }

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Request',
        properties: {
          name: { type: 'string', title: 'Function' },
          connection: connectionType,
          retry: retryType,
          circuit: circuitType,
          cache: cacheType,
        },
        required: ['protocol', 'basePath'],
      },
    };
  }
}

