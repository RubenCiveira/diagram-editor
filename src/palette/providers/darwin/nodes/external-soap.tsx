import { ExternalLink } from 'lucide-react';
import { DiagramNode, ElementKind } from '../../../../diagram';
import { DiagramElementType } from '../../../DiagramElementType';
import { DialogRender } from '../../../../dialog/DialogRender';

export type ExternalSoapProps = {
  serviceType: 'db' | 'microservice' | 'elk' | 'trx' | 'oauth' | 'queue' | 'cache' | 'storage';
  name?: string;
  endpoint?: string;
  notes?: string;
};

export class ExternalSoapElement implements DiagramElementType<ExternalSoapProps> {
  kind: ElementKind = 'externalSoap';
  title = 'Web service';
  paletteIcon = (<ExternalLink size={18} />);

  
  constructor(public readonly render: DialogRender) {
  }

  async open(props: ExternalSoapProps, node: DiagramNode): Promise<void> {
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
        title: 'Web service',
        properties: {
          serviceType: {
            type: 'string',
            title: 'Tipo',
            enum: ['db', 'microservice', 'elk', 'trx', 'oauth', 'queue', 'cache', 'storage'],
          },
          name: { type: 'string', title: 'Nombre' },
          endpoint: { type: 'string', title: 'Endpoint', format: 'url' },
          notes: { type: 'string', title: 'Notas' },
        },
        required: ['serviceType'],
      },
    };
  }

  category() {
    return 'component' as const;
  }

  nodeIcon() {
    return <ExternalLink size={50} />;
  }

  acceptsIncoming() {
    return true;
  }

  acceptsOutgoing() {
    return false;
  }

  defaultProps(): ExternalSoapProps {
    return {
      serviceType: 'db',
      name: 'PostgreSQL',
      endpoint: 'postgres://host:5432/db',
    };
  }
  label({ name, props }: { name?: string; props: ExternalSoapProps }) {
    const n = name ?? props.name ?? 'externo';
    return `${n} (${props.serviceType})`;
  }
  apiRole() {
    return 'provider' as const;
  }
}
