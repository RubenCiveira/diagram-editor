import { Cog } from 'lucide-react';
import type { DiagramElementType } from '../../../DiagramElementType';
import type { DiagramNode, ElementKind, RealtimeDiagram } from '../../../../diagram';
import { CheckPending } from '../contextuals/CheckPending';
import { Merge } from '../contextuals/Merge';
import { Deploy } from '../contextuals/Deploy';
import { DeployConfig } from '../contextuals/DeployConfig';
import { DialogRender } from '../../../../dialog/DialogRender';
import { NodeActionItem } from '../../../../metadata/FormDefinition';

export type MicroserviceProps = {
  tech: 'quarkus' | 'spring' | 'php-slim' | 'node';
  baseUrl: string;
};

export class MicroserviceElement implements DiagramElementType<MicroserviceProps> {
  kind: ElementKind = 'microservice';
  title = 'Microservicio';
  paletteIcon = (<Cog size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: MicroserviceProps, node: DiagramNode, diagram: RealtimeDiagram): Promise<void> {
    const data = await this.render.showEdit({
      value: props,
      title: node.name || node.id,
      errors: node.errors,
      warns: node.warns,
      definition: this.definition(),
      actions: this.getHeaderActions(props, node),
      menu: this.getMoreMenuActions(props, node),
    });
    if (data.accepted) {
      diagram.update(node, data.title, data.data);
    }
  }

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Microservicio',
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
    return <Cog size={50} />;
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
  defaultProps(): MicroserviceProps {
    return { tech: 'quarkus', baseUrl: 'https://api.example.com/service' };
  }
  label({ name, props }: { name?: string; props: MicroserviceProps }) {
    return name ?? `svc:${props.tech}`;
  }
  apiRole() {
    return 'provider' as const;
  }

  getHeaderActions(_props: MicroserviceProps, _content: DiagramNode): NodeActionItem[] {
    return [
      new CheckPending({ url: '', disabled: false }),
    ];
  }

  getMoreMenuActions(_props: MicroserviceProps, _content: DiagramNode): NodeActionItem[] {
    return [
      new Merge({ url: '', disabled: false }),
      new Deploy({ url: '', disabled: false }),
      new DeployConfig({ url: '', disabled: false }),
    ];
  }
}
