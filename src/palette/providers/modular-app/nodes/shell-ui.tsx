import { LayoutTemplate } from 'lucide-react';
import { DiagramNode, ElementKind, RealtimeDiagram } from '../../../../diagram';
import { DiagramElementType } from '../../../DiagramElementType';
import { DialogRender } from '../../../../dialog/DialogRender';

export type ShellUiProps = { routeBase: string; authRequired?: boolean };

export class ShellUiElement implements DiagramElementType<ShellUiProps> {
  kind: ElementKind = 'shellUi';
  title = 'Shell UI';
  paletteIcon = (<LayoutTemplate size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: ShellUiProps, node: DiagramNode, diagram: RealtimeDiagram): Promise<void> {
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
