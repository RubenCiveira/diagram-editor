import { Shield } from 'lucide-react';
import type { DiagramElementType } from '../../../DiagramElementType';
import type { DiagramNode, ElementKind } from '../../../../diagram';
import { DialogRender } from '../../../../dialog/DialogRender';

export type OAuthProxyProps = {
  path: string;
  targetUrl: string;
  rewrite?: string;
  cors?: boolean;
  cacheTtl?: number;
};

export class OAuthProxyElement implements DiagramElementType<OAuthProxyProps> {
  kind: ElementKind = 'remoteOAuth';
  title = 'OAuth';
  paletteIcon = (<Shield size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: OAuthProxyProps, node: DiagramNode): Promise<void> {
    await this.render.showEdit({
      id: node.id,
      value: props,
      title: node.name || node.id,
      errors: node.errors,
      warns: node.warns,
      definition: this.definition(),
    });
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
    return <Shield size={50} />;
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
  defaultProps(): OAuthProxyProps {
    return {
      path: '/api',
      targetUrl: 'http://svc:8080/',
      rewrite: '^/api -> /',
      cors: true,
      cacheTtl: 0,
    };
  }
  label({ name, props }: { name?: string; props: OAuthProxyProps }) {
    return name ?? `${props.path} → ${props.targetUrl}`;
  }
  apiRole() {
    return 'provider' as const;
  }
}
