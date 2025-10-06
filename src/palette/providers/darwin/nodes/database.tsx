import { Database } from 'lucide-react';
import { DiagramNode, ElementKind } from '../../../../diagram';
import { DialogRender } from '../../../../dialog/DialogRender';
import { DiagramElementType } from '../../../DiagramElementType';

export type DatabaseProps = {
  tech: 'quarkus' | 'spring' | 'php-slim' | 'node';
  baseUrl: string;
};

export class DatabaseElement implements DiagramElementType<DatabaseProps> {
  kind: ElementKind = 'database';
  title = 'Database';
  paletteIcon = (<Database size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: DatabaseProps, node: DiagramNode): Promise<void> {
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
        title: 'Database',
        properties: {
          tech: {
            type: 'string',
            title: 'Tecnología',
            enum: ['quarkus', 'spring', 'php-slim', 'node'],
          },
          baseUrl: { type: 'string', title: 'Base URL', format: 'url' },
        },
        required: ['tech'],
      },
    };
  }

  nodeIcon() {
    return <Database size={50} />;
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
  defaultProps(): DatabaseProps {
    return { tech: 'quarkus', baseUrl: 'https://api.example.com/service' };
  }
  label({ name, props }: { name?: string; props: DatabaseProps }) {
    return name ?? `svc:${props.tech}`;
  }
  apiRole() {
    return 'provider' as const;
  }
}
