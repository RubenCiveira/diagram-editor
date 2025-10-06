import { ReactNode } from 'react';
import { Router } from 'lucide-react';
import { DiagramElementType } from '../../../DiagramElementType';
import { DialogRender } from '../../../../dialog/DialogRender';
import { DiagramNode } from '../../../../diagram';

export type GatewayProps = {
  namePattern?: string;
  entryHost?: string;
  entryPath?: string;
  rateLimit?: number;
};

export class GatewayElement implements DiagramElementType<GatewayProps> {
  kind = 'gateway' as const;
  title = 'Gateway';
  paletteIcon = (<Router size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: GatewayProps, node: DiagramNode): Promise<void> {
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
        title: 'Gateway de entrada',
        properties: {
          namePattern: { type: 'string', title: 'Nombre / patrón' },
          entryHost: { type: 'string', title: 'Host de entrada' },
          entryPath: { type: 'string', title: 'Path base', default: '/' },
          rateLimit: { type: 'number', title: 'Rate limit (req/s)', minimum: 0 },
        },
      },
    };
  }

  category() {
    return 'component' as const;
  }

  nodeIcon() {
    return <Router size={50} />;
  }

  defaultProps(): GatewayProps {
    return {
      namePattern: 'gw-*',
      entryHost: 'gateway.example.com',
      entryPath: '/',
      rateLimit: 0,
    };
  }

  label({ name }: { name?: string; props: GatewayProps }) {
    return name || 'Gateway';
  }

  /** 🔽 puede generar hijos por abajo */
  acceptsChilds() {
    return true;
  }

  // Laterales por defecto
  acceptsIncoming() {
    return true;
  }
  acceptsOutgoing() {
    return true;
  }

  nodeSize() {
    return { width: 96, height: 96 };
  }

  renderShape?(_props: GatewayProps, content: ReactNode): ReactNode {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 14,
          background: '#ffffff',
          border: '2px solid #22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  isResizable() {
    return false;
  }
  isBackground() {
    return false;
  }
}
