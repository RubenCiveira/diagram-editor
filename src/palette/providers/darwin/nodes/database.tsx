import { Database } from 'lucide-react';
import { ElementKind } from '../../../../diagram';
import { DiagramElementType } from '../../../DiagramElementType';

export type DatabaseProps = {
  tech: 'quarkus' | 'spring' | 'php-slim' | 'node';
  baseUrl: string;
};

export class DatabaseElement implements DiagramElementType<DatabaseProps> {
  kind: ElementKind = 'database';
  title = 'Database';
  paletteIcon = (<Database size={18} />);

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
