import { ReactNode } from 'react';
import { Code } from 'lucide-react';
import { DiagramElementType } from '../../../DiagramElementType';
import type { ElementKind, RealtimeDiagram } from '../../../../diagram';
import { DiagramModel, DiagramNode } from '../../../../diagram';
import { DialogRender } from '../../../../dialog/DialogRender';

export type ApiProps = {
  protocol: 'http' | 'https' | 'grpc';
  basePath: string;
  version?: string;
  auth?: 'none' | 'basic' | 'oauth';
  specUrl?: string;
};

export class ApiElement implements DiagramElementType<ApiProps> {
  kind: ElementKind | 'api' = 'api';
  title = 'API';
  paletteIcon = (<Code size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: ApiProps, node: DiagramNode, diagram: RealtimeDiagram): Promise<void> {
    const data = await this.render.showEdit({
      value: props,
      title: node.name || node.id,
      errors: node.errors,
      warns: node.warns,
      definition: this.definition(),
    });
    if (data.accepted) {
      console.log(data.title);
      diagram.update(node.id, data.title, data.data);
    }
  }

  definition() {
    return {
      schema: {
        type: 'object',
        title: 'API',
        properties: {
          protocol: { type: 'string', title: 'Protocolo', enum: ['http', 'https', 'grpc'], default: 'https' },
          basePath: { type: 'string', title: 'Base Path', description: '/users' },
          version: { type: 'string', title: 'Versión', default: 'v1' },
          auth: { type: 'string', title: 'Auth', enum: ['none', 'basic', 'oauth'], default: 'oauth' },
          specUrl: { type: 'string', title: 'Spec URL', format: 'url' },
        },
        required: ['protocol', 'basePath'],
      },
    };
  }

  defaultProps(): ApiProps {
    return { protocol: 'https', basePath: '/api', version: 'v1', auth: 'oauth' };
  }

  label({ name, props }: { name?: string; props: ApiProps }) {
    const id = `${props.protocol.toUpperCase()} ${props.basePath}${props.version ? ' ' + props.version : ''}`;
    return name ? `${name}` : id;
  }

  nodeIcon() {
    return <Code size={45} />;
  }

  reportProperties(props: ApiProps, _node: DiagramNode, _doc: DiagramModel): string {
    const esc = (s?: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const tr = (k: string, v?: string) =>
      `<tr><th style="text-align:left;padding:4px 6px;">${k}</th><td style="padding:4px 6px;">${esc(v)}</td></tr>`;
    return `
<table style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
  <tbody>
    ${tr('Protocolo', props.protocol)}
    ${tr('Base Path', props.basePath)}
    ${tr('Versión', props.version)}
    ${tr('Auth', props.auth)}
    ${tr('Spec URL', props.specUrl)}
  </tbody>
</table>`.trim();
  }

  category() {
    return 'component' as const;
  }

  /** 🔼 acepta conexión desde un padre (por arriba) */
  acceptsParents() {
    return true;
  }

  // El resto de handles laterales por defecto
  acceptsIncoming() {
    return true;
  }
  acceptsOutgoing() {
    return true;
  }

  renderShape?(_props: ApiProps, content: ReactNode): ReactNode {
    // API redonda, etiqueta debajo (ya la pone el editor)
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '9999px',
          background: '#ffffff',
          border: '2px solid #0ea5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  nodeSize() {
    return { width: 80, height: 80 };
  }

  isResizable() {
    return false;
  }
  isBackground() {
    return false;
  }
}
