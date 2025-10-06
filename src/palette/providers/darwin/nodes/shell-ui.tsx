import { LayoutTemplate } from 'lucide-react';
import { ElementKind } from '../../../../diagram';
import { DiagramElementType } from '../../../DiagramElementType';

export type ShellUiProps = { routeBase: string; authRequired?: boolean };

export class ShellUiElement implements DiagramElementType<ShellUiProps> {
  kind: ElementKind = 'shellUi';
  title = 'Shell UI';
  paletteIcon = (<LayoutTemplate size={18} />);

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Shell UI',
        properties: {
          routeBase: { type: 'string', title: 'Ruta base', description: '/app' },
          authRequired: { type: 'boolean', title: 'Requiere auth' },
        },
        required: ['routeBase'],
      },
    };
  }

  nodeIcon() {
    return <LayoutTemplate size={50} />;
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
  defaultProps(): ShellUiProps {
    return { routeBase: '/app', authRequired: true };
  }
  label({ name, props }: { name?: string; props: ShellUiProps }) {
    return name ?? `Shell ${props.routeBase}`;
  }
  apiRole() {
    return 'consumer' as const;
  }
}
