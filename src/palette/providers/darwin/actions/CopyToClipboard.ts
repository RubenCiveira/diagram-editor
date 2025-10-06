import { ActionItem } from '../../../ActionItem';

export const CopyToClipboard = {
  id: 'copy-json',
  title: 'Copiar JSON del grafo',
  subtitle: 'Copia el diagrama actual al portapapeles',
  // icon: <ClipboardList size={18} />,
  run: async (doc) => {
    const txt = JSON.stringify(doc, null, 2);
    await navigator.clipboard.writeText(txt);
    alert('JSON del diagrama copiado al portapapeles.');
  },
} as ActionItem;
