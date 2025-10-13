import React from "react";
import './StackView.scss';

export type RecordItem = {
  id: string;
  label: string;
  subtitle?: string;
  rightHint?: string; // texto corto a la derecha (opcional)
};

type Props = {
  title?: string;
  items: RecordItem[];
  /** id seleccionado inicialmente (opcional) */
  initialSelectedId?: string;
  /** posición inicial de la ventana */
  initialPos?: { x: number; y: number };
  /** ancho fijo (px) – opcional */
  width?: number;
  /** alto máximo de la lista (px) – el panel hace scroll */
  listMaxHeight?: number;
  /** callbacks */
  onSelect?: (items: RecordItem[]) => void;
  onClose?: () => void;                                   // Esc / botón cerrar
};

export default function ({
  title = 'Registros',
  items,
  initialSelectedId,
  initialPos = { x: 80, y: 80 },
  width = 420,
  listMaxHeight = 320,
  onSelect,
  onClose,
}: Props) {
  const [pos, setPos] = React.useState(initialPos);
  const draggingRef = React.useRef<{ dx: number; dy: number } | null>(null);

 // selección
  const [selIndex, setSelIndex] = React.useState<number>(() => {
    if (!initialSelectedId) return items.length ? 0 : -1;
    const idx = items.findIndex(i => i.id === initialSelectedId);
    return idx >= 0 ? idx : (items.length ? 0 : -1);
  });

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  // mantener selIndex dentro de rango si cambia la lista
  React.useEffect(() => {
    if (items.length === 0) { setSelIndex(-1); return; }
    setSelIndex((i) => {
      const clamped = Math.max(0, Math.min(i < 0 ? 0 : i, items.length - 1));
      return clamped;
    });
  }, [items]);

  // foco y listeners
  React.useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // arrastre por cabecera
  const onHeaderPointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    draggingRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { dx, dy } = draggingRef.current;
    const x = e.clientX - dx;
    const y = e.clientY - dy;
    // mantener dentro de viewport con un margen
    const margin = 8;
    const maxX = window.innerWidth - margin - width;
    const maxY = window.innerHeight - margin - 80; // aprox alto cabecera
    setPos({
      x: Math.max(margin, Math.min(x, Math.max(margin, maxX))),
      y: Math.max(margin, Math.min(y, Math.max(margin, maxY))),
    });
  };
  const onHeaderPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // teclado
  const moveSel = (delta: number) => {
    if (!items.length) return;
    setSelIndex((i) => {
      const next = Math.max(0, Math.min((i < 0 ? 0 : i) + delta, items.length - 1));
      if (next !== i) {
        onSelect?.( items.slice(0, next+1) );
      }
      return next;
    });
  };
  const setSelAbs = (idx: number) => {
    if (!items.length) return;
    const next = Math.max(0, Math.min(idx, items.length - 1));
    setSelIndex((i) => {
      if (next !== i) onSelect?.( items.slice(0, next+1) );
      return next;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'PageDown') { e.preventDefault(); moveSel(+10); }
    else if (e.key === 'PageUp') { e.preventDefault(); moveSel(-10); }
    else if (e.key === 'Home') { e.preventDefault(); setSelAbs(0); }
    else if (e.key === 'End') { e.preventDefault(); setSelAbs(items.length - 1); }
  };

  // scroll al seleccionado
  React.useEffect(() => {
    if (selIndex < 0) return;
    const el = itemRefs.current[selIndex];
    const list = listRef.current;
    if (!el || !list) return;
    const eTop = el.offsetTop;
    const eBot = eTop + el.offsetHeight;
    const vTop = list.scrollTop;
    const vBot = vTop + list.clientHeight;
    if (eTop < vTop) list.scrollTop = eTop - 8;
    else if (eBot > vBot) list.scrollTop = eBot - list.clientHeight + 8;
  }, [selIndex]);

  return (
    <div
      ref={containerRef}
      className="flw-window"
      style={{ left: pos.x, top: pos.y, width }}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div
        className="flw-header"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      >
        <div className="flw-title">{title}</div>
        <button className="flw-close" onClick={() => onClose?.()} aria-label="Cerrar">✕</button>
      </div>

      <div className="flw-body">
        <div
          ref={listRef}
          className="flw-list"
          style={{ maxHeight: listMaxHeight }}
        >
          {items.map((it, idx) => (
            <button
              key={it.id}
              className={`flw-row ${idx === selIndex ? 'is-selected' : ''}`}
              onMouseEnter={() => { if (idx !== selIndex) setSelAbs(idx); }}
              onClick={() => { setSelAbs(idx); }}
              title={it.label}
            >
              <div className="flw-row-main">
                <div className="flw-row-label">{it.label}</div>
                {it.subtitle && <div className="flw-row-sub">{it.subtitle}</div>}
              </div>
              {it.rightHint && <div className="flw-row-hint">{it.rightHint}</div>}
            </button>
          ))}
          {items.length === 0 && (
            <div className="flw-empty">Sin registros</div>
          )}
        </div>
      </div>
    </div>
  );
}