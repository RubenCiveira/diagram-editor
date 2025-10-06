import { Waypoints } from 'lucide-react';
import { DiagramNode, ElementKind, RealtimeDiagram } from '../../../../diagram';
import { DiagramElementType } from '../../../DiagramElementType';
import { DialogRender } from '../../../../dialog/DialogRender';

export type GatewayProxyProps = {
  path: string;
  targetUrl: string;
  rewrite?: string;
  cors?: boolean;
  cacheTtl?: number;
};

export class GatewayProxyElement implements DiagramElementType<GatewayProxyProps> {
  kind: ElementKind = 'gatewayProxy';
  title = 'Gateway Proxy';
  paletteIcon = (<Waypoints size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: GatewayProxyProps, node: DiagramNode, diagram: RealtimeDiagram): Promise<void> {
    const data = await this.render.showEdit({
      value: props,
      title: node.name || node.id,
      errors: node.errors,
      warns: node.warns,
      definition: this.definition(),
    });
    if (data.accepted) {
      console.log(data.title);
      diagram.update(node.id, data.title, data.data);
    }
  }

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Proxy Rule',
        properties: {
          path: { type: 'string', title: 'Path', description: '/api/users' },
          targetUrl: { type: 'string', title: 'Target URL', format: 'url' },
          rewrite: { type: 'string', title: 'Rewrite', description: '^/api -> /' },
          cors: { type: 'boolean', title: 'CORS' },
          cacheTtl: { type: 'integer', title: 'Cache TTL (s)' },
        },
        required: ['path', 'targetUrl'],
      },
    };
  }

  nodeIcon() {
    return <Waypoints size={50} />;
  }
  category() {
    return 'component' as const;
  }
  acceptsIncoming() {
    return true;
  }
  acceptsOutgoing() {
    return true;
  }
  defaultProps(): GatewayProxyProps {
    return {
      path: '/api',
      targetUrl: 'http://svc:8080/',
      rewrite: '^/api -> /',
      cors: true,
      cacheTtl: 0,
    };
  }
  label({ name, props }: { name?: string; props: GatewayProxyProps }) {
    return name ?? `${props.path} → ${props.targetUrl}`;
  }
  apiRole() {
    return 'provider' as const;
  }
}
