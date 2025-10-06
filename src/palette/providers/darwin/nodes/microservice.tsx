import { Cog } from 'lucide-react';
import type { DiagramElementType, NodeActionItem } from '../../../DiagramElementType';
import type { DiagramNode, ElementKind } from '../../../../diagram';
import { CheckPending } from '../contextuals/CheckPending';
import { Merge } from '../contextuals/Merge';
import { Deploy } from '../contextuals/Deploy';
import { DeployConfig } from '../contextuals/DeployConfig';
import { DialogRender } from '../../../../dialog/DialogRender';

export type MicroserviceProps = {
  tech: 'quarkus' | 'spring' | 'php-slim' | 'node';
  baseUrl: string;
};

export class MicroserviceElement implements DiagramElementType<MicroserviceProps> {
  kind: ElementKind = 'microservice';
  title = 'Microservicio';
  paletteIcon = (<Cog size={18} />);
  
  constructor(public readonly render: DialogRender) {
  }

  async open(props: MicroserviceProps, node: DiagramNode): Promise<void> {
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
    return [];
  }
  
  getMoreMenuActions(_props: MicroserviceProps, _content: DiagramNode): NodeActionItem[] {
    return [
      new CheckPending({url: '', disabled: false}),
      new Merge({url: '', disabled: false}),
      new Deploy({url: '', disabled: false}),
      new DeployConfig({url: '', disabled: false}),
    ];
  }
}
