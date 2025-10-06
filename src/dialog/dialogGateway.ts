import { DiagramRender } from '../diagram/render';

let _render: DiagramRender | null = null;

export function attachDiagramRender(ui: DiagramRender) {
  _render = ui;
}

export function getDiagramRender(): DiagramRender {
  if (!_render) {
    throw new Error('DiagramRender no está adjunto. Envuelve la app con el provider y llama attachDiagramUI.');
  }
  return _render;
}

