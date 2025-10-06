import { Puzzle } from 'lucide-react';
import type { DiagramElementType, IncomingEdge } from '../../../DiagramElementType';
import { ElementKind } from '../../../../diagram';

export type MicroFrontProps = {
  route: string;
  remoteEntryUrl: string;
  exposedModule: string;
  version?: string;
  dependsOn?: string[];
};

export class MicroFrontElement implements DiagramElementType<MicroFrontProps> {
  kind: ElementKind = 'microFront';
  title = 'Micro Front';
  paletteIcon = (<Puzzle size={18} />);

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Micro Front',
        properties: {
          route: { type: 'string', title: 'Ruta', description: '/color' },
          remoteEntryUrl: {
            type: 'string',
            title: 'remoteEntryUrl',
            format: 'url',
          },
          exposedModule: {
            type: 'string',
            title: 'exposedModule',
            description: './ColorModule',
          },
          version: { type: 'string', title: 'Versión' },
          dependsOn: {
            type: 'array',
            title: 'Depende de',
            items: { type: 'string' },
          },
        },
        required: ['route', 'remoteEntryUrl', 'exposedModule'],
      },
    };
  }

  nodeIcon() {
    return <Puzzle size={50} />;
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

  verifyConnectFrom?(from: IncomingEdge): void {
    const valids = ['shellUi'];
    if (!valids.includes(from.sourceKind)) {
      throw 'Only from shell';
    }
  }
  defaultProps(): MicroFrontProps {
    return {
      route: '/info',
      remoteEntryUrl: 'https://cdn/app/remoteEntry.js',
      exposedModule: './InfoModule',
      version: '1.0.0',
      dependsOn: [],
    };
  }
  label({ name, props }: { name?: string; props: MicroFrontProps }) {
    return name ?? `MF ${props.route}`;
  }
  apiRole() {
    return 'consumer' as const;
  }
}
