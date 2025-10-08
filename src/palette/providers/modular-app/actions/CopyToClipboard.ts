import { DiagramDescriptor } from '../../../../diagram/descriptor';
import { ActionItem } from '../../../ActionItem';

export class CopyToClipboard implements ActionItem {
  id= 'copy-json';
  title= 'Copiar JSON del grafo';
  subtitle= 'Copia el diagrama actual al portapapeles';

  async exec(graph: DiagramDescriptor): Promise<void> {
    const txt = JSON.stringify(graph.model(), null, 2);
    await navigator.clipboard.writeText(txt);
    alert('JSON del diagrama copiado al portapapeles.');
  }
};
