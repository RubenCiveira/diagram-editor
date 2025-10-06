import React from 'react';
import './PaletteDrawer.scss';
import { DiagramElementType } from '../../DiagramElementType';
import { ElementKind } from '../../../diagram';

type Props = {
  items: Record<ElementKind, DiagramElementType<any>>;
  open: boolean;
  onClose(): void;
  onPick(kind: string): void;
};

export default function PaletteDrawer({ items, open, onClose, onPick }: Props) {
  const escHandler = React.useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);

  React.useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', escHandler);
    return () => document.removeEventListener('keydown', escHandler);
  }, [open, escHandler]);

  if (!open) return null;

  const KINDS = Object.entries(items);

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <aside
        className="palette-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de componentes"
      >
        <div className="palette-header">
          <h3>Paleta de componentes</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar paleta">✕</button>
        </div>

        <div className="palette-list">
          {KINDS.map(([kind, def]) => (
            <button key={kind} className="palette-item" onClick={() => onPick(kind)} title={def.title}>
              <span className="palette-icon">{def.paletteIcon ?? '⬚'}</span>
              <span className="palette-title">{def.title}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
