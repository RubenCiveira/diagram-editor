import { ExternalLink } from 'lucide-react';
import { DiagramNode, ElementKind, RealtimeDiagram } from '../../../../diagram';
import { DiagramElementType } from '../../../DiagramElementType';
import { DialogRender } from '../../../../dialog/DialogRender';

export type ExternalServiceProps = {
  serviceType: 'db' | 'microservice' | 'elk' | 'trx' | 'oauth' | 'queue' | 'cache' | 'storage';
  name?: string;
  endpoint?: string;
  notes?: string;
};

export class ExternalServiceElement implements DiagramElementType<ExternalServiceProps> {
  kind: ElementKind = 'externalService';
  title = 'Servicio REST';
  paletteIcon = (<ExternalLink size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: ExternalServiceProps, node: DiagramNode, diagram: RealtimeDiagram): Promise<void> {
    const data = await this.render.showEdit({
      value: props,
      title: node.name || node.id,
      errors: node.errors,
      warns: node.warns,
      definition: this.definition(),
    });
    if (data.accepted) {
      diagram.update(node.id, data.title, data.data);
    }
  }

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Servicio REST',
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

  defaultProps(): ExternalServiceProps {
    return {
      serviceType: 'db',
      name: 'PostgreSQL',
      endpoint: 'postgres://host:5432/db',
    };
  }
  label({ name, props }: { name?: string; props: ExternalServiceProps }) {
    const n = name ?? props.name ?? 'externo';
    return `${n} (${props.serviceType})`;
  }
  apiRole() {
    return 'provider' as const;
  }
}
