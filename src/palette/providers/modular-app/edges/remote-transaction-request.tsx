import { RealtimeDiagram } from '../../../../diagram';
import { DialogRender } from '../../../../dialog/DialogRender';
import { DiagramEdgeType, DiagramEdgeTypeCtx } from '../../../DiagramEdgeType';

export type RemoteRequestProps = {
  protocol: 'http' | 'https' | 'grpc';
  basePath: string;
  version?: string;
  auth?: 'none' | 'basic' | 'oauth';
  specUrl?: string;
};

export class RemoteTransactionRequest implements DiagramEdgeType<RemoteRequestProps> {
  constructor(public readonly render: DialogRender) {}

  label(_ctx: DiagramEdgeTypeCtx): string {
    return 'Noop';
  }

  precedence(ctx: DiagramEdgeTypeCtx): number {
    const validSources = ['microservice'];
    const validTargets = ['externalTransaction'];
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
        title: 'Transaction',
        properties: {
          code: { type: 'string', title: 'Codigo' },
          host: { type: 'string', title: 'Host' },
        },
        required: ['protocol', 'basePath'],
      },
    };
  }
}

