import ReactMarkdown from 'react-markdown';
import { StickyNote, Palette, FilePlus2, Eraser } from 'lucide-react';
import type { DiagramElementType, NodeActionItem } from '../../../DiagramElementType';
import { DiagramModel, DiagramNode } from '../../../../diagram';
import { ReactNode } from 'react';
import { DialogRender } from '../../../../dialog/DialogRender';

export type NoteProps = {
  text: string;
  color?: 'yellow' | 'blue' | 'green' | 'pink';
};

const COLORS = {
  yellow: { bg: '#FEF9C3', border: '#FDE68A' },
  blue: { bg: '#DBEAFE', border: '#BFDBFE' },
  green: { bg: '#DCFCE7', border: '#BBF7D0' },
  pink: { bg: '#FCE7F3', border: '#FBCFE8' },
} as const;

const ORDER: NoteProps['color'][] = ['yellow', 'blue', 'green', 'pink'];

export class NoteElement implements DiagramElementType<NoteProps> {
  kind = 'note' as const;
  title = 'Nota';
  paletteIcon = (<StickyNote size={18} />);

  constructor(public readonly render: DialogRender) {}

  async open(props: NoteProps, node: DiagramNode): Promise<void> {
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
        title: 'Nota',
        properties: {
          text: { type: 'string', title: 'Contenido (Markdown)' },
          color: { type: 'string', title: 'Color', enum: ORDER, default: 'yellow' },
        },
        required: ['text'],
      },
      uiSchema: {
        'ui:order': ['text', 'color'],
        text: { 'ui:widget': 'markdown', 'ui:options': { rows: 8 } },
        color: { 'ui:widget': 'select' },
      },
    };
  }

  defaultProps(): NoteProps {
    return {
      text: '## Nueva nota\n\nPuedes escribir *Markdown* aquí.',
      color: 'yellow',
    };
  }

  label({ name }: { name?: string }) {
    return name || 'Nota';
  }

  reportProperties(props: NoteProps, _node: DiagramNode, _doc: DiagramModel): string {
    const esc = (s?: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const body = props.text ? `<blockquote>${esc(props.text)}</blockquote>` : '<em>(sin contenido)</em>';
    return `
<div>
  ${body}
</div>`.trim();
  }

  category() {
    return 'note' as const;
  }

  acceptsIncoming() {
    return false;
  }
  acceptsOutgoing() {
    return false;
  }
  isBackground() {
    return true;
  }
  isResizable() {
    return true;
  }
  nodeSize() {
    return { width: 220, height: 140 };
  }

  renderShape?(props: NoteProps, content: ReactNode): ReactNode {
    const palette = COLORS[props.color ?? 'yellow'];
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          boxShadow: '0 1px 2px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.5)',
          padding: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            fontSize: 12,
            color: '#111827',
          }}
        >
          <ReactMarkdown>{props.text ?? ''}</ReactMarkdown>
          {content}
        </div>
      </div>
    );
  }

  /** 🔹 Botones principales (header) */
  getHeaderActions(props: NoteProps): NodeActionItem[] {
    return [
      {
        icon: <Palette size={16} />,
        label: 'Cambiar color',
        title: 'Cicla entre amarillo, azul, verde y rosa',
        onClick: () => {
          const current = (props.color as NoteProps['color']) ?? 'yellow';
          const idx = ORDER.indexOf(current);
          const next = ORDER[(idx + 1) % ORDER.length]!;
          props.color = next;
        },
      },
    ];
  }

  /** 🔹 Menú “más” (dropdown) */
  getMoreMenuActions(props: NoteProps): NodeActionItem[] {
    return [
      {
        icon: <FilePlus2 size={16} />,
        label: 'Insertar plantilla',
        onClick: () => {
          const sample = [
            '## Título de la nota',
            '',
            '- Punto 1',
            '- Punto 2',
            '',
            '> Recuerda que puedes usar **Markdown**.',
          ].join('\n');
          props.text = sample;
        },
      },
      {
        icon: <Eraser size={16} />,
        label: 'Vaciar contenido',
        danger: false,
        onClick: () => {
          props.text = '';
        },
      },
    ];
  }
}
