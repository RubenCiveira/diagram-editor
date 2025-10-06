import { CircleUserRound, Contact, ShieldUser, User } from 'lucide-react';
import type { DiagramElementType } from '../../../DiagramElementType';
import type { DiagramModel, DiagramNode, ElementKind, RealtimeDiagram } from '../../../../diagram';
import { ReactNode } from 'react';
import { DialogRender } from '../../../../dialog/DialogRender';

export type UserProps = {
  category: 'Empleado' | 'Cliente' | 'Publico' | 'Operador';
};

export class DarwinUser implements DiagramElementType<UserProps> {
  kind: ElementKind = 'darwin-user';
  title = 'Usuario';
  paletteIcon = (<User size={18} />);
  
  constructor(public readonly render: DialogRender) {
  }

  async open(props: UserProps, node: DiagramNode, diagram: RealtimeDiagram): Promise<void> {
    const data = await this.render.showEdit({
      value: props,
      title: node.name || node.id,
      errors: node.errors,
      warns: node.warns,
      definition: this.definition(),
    });
    if( data.accepted ) {
      console.log( data.title );
      diagram.update(node.id, data.title, data.data );
    }
  }

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'Usuario',
        properties: {
          category: {
            type: 'string',
            title: 'Tipo',
            enum: ['Empleado', 'Cliente', 'Publico', 'Operador'],
          },
        },
        required: ['category'],
      },
    };
  }

  nodeIcon(props: UserProps): ReactNode {
    if (props.category === 'Empleado') {
      return <Contact size={50} />;
    } else if (props.category === 'Operador') {
      return <ShieldUser size={50} />;
    } else if (props.category === 'Cliente') {
      return <CircleUserRound size={50} />;
    }
    return <User size={50} />;
  }

  category() {
    return 'actor' as const;
  }

  exportOrder() {
    return 10;
  } // primero entre actores

  acceptsIncoming() {
    return false;
  }

  acceptsOutgoing() {
    return true;
  }

  defaultProps(): UserProps {
    return { category: 'Cliente' };
  }

  label({ name, props }: { name?: string; props: UserProps }) {
    return `${name ?? 'Usuario'} (${props.category})`;
  }

  apiRole() {
    return 'consumer' as const;
  }

  reportProperties(props: UserProps, _node: DiagramNode, _doc: DiagramModel): string {
    const body = props.category;
    return `
  <div>
    ${body}
  </div>`.trim();
  }

}
