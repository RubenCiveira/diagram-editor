import React from 'react';
import type { WidgetProps } from '@rjsf/utils';
import ReactMarkdown from 'react-markdown';

/* --------------------------- Widgets personalizados --------------------------- */

/** Widget Markdown con área de texto y previsualización */
function MarkdownWidget(props: WidgetProps) {
  const { id, value = '', disabled, readonly, onChange, label } = props;
  const [tab, setTab] = React.useState<'edit' | 'preview'>('edit');

  return (
    <div>
      {label && <label htmlFor={id} style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{label}</label>}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <button type="button" onClick={() => setTab('edit')} disabled={tab === 'edit'}>Editar</button>
        <button type="button" onClick={() => setTab('preview')} disabled={tab === 'preview'}>Vista previa</button>
      </div>
      {tab === 'edit' ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || readonly}
          style={{ width: '100%', minHeight: 140, padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
      ) : (
        <div style={{
          width: '100%', minHeight: 140, padding: 12, borderRadius: 8,
          border: '1px solid #e5e7eb', background: '#fff', overflow: 'auto'
        }}>
          <ReactMarkdown>{value || ''}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/** Widget color simple */
function ColorWidget(props: WidgetProps) {
  const { id, value = '#000000', disabled, readonly, onChange, label } = props;
  return (
    <div>
      {label && <label htmlFor={id} style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{label}</label>}
      <input
        type="color"
        id={id}
        value={value}
        disabled={disabled || readonly}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 48, height: 32, padding: 0, border: 'none', background: 'transparent' }}
      />
    </div>
  );
}

/** Registra widgets personalizados por nombre */
export const Widgets = {
  markdown: MarkdownWidget,
  color: ColorWidget,
};
