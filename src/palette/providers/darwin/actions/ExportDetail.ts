import { FormDefinition } from '../../../../metadata/FormDefinition';
import { ActionItem } from '../../../ActionItem';
import { DiagramDescriptor } from '../../../../diagram/descriptor';
import { DialogRender } from '../../../../dialog/DialogRender';
import { BuildDiagramReport } from './BuildDiagramReport';

export class ExportDetails implements ActionItem {
  id = 'export-html';
  title = 'Exportar resumen (HTML)';
  subtitle = 'Genera un documento con índice, propiedades y relaciones';

  public constructor(private readonly render: DialogRender) {}

  async exec(graph: DiagramDescriptor): Promise<void> {
    const data = await this.render.showEdit({
      id: '',
      value: {},
      definition: this.definition(),
    });
    if (data.accepted) {
      const builder = new BuildDiagramReport(graph);
      const svg = await graph.toSvg();
      const html = builder.buildDiagramHTML(ensureSvgSrc(svg));
      this.render.showReport( html );
    }
  }

  definition(): FormDefinition {
    return {
      schema: {
        type: 'object',
        title: 'Nota',
        properties: {
          text: { type: 'string', title: 'Contenido (Markdown)' },
        },
        required: ['text'],
      },
    };
  }

  // async run(doc, _data, svg) => {
  //   // const builder = new BuildDiagramReport(extractor);
  //   const builder = new BuildDiagramReport(new DiagramDescriptor(doc, DARWIN_NODES));
  //   const html = builder.buildDiagramHTML(ensureSvgSrc(svg));
  //   //     const svgSrc = ensureSvgSrc(svg);
  //   //     const html = `<!doctype html>
  //   // <html>
  //   // <head><meta charset="utf-8"><title>Reporte</title>
  //   // <style>body{margin:0;padding:24px;font:14px system-ui,sans-serif}</style></head>
  //   // <body>
  //   //   <h1>Aqui ${data.text}</h1>
  //   //   <img src="${svgSrc}" alt="Diagrama" style="max-width:100%;height:auto;display:block;margin:auto" />
  //   // </body>
  //   // </html>`;
  //   // doc.nodes.forEach(node => {
  //   //   node.errors = ['FALLO'];
  //   // });
  //   return { content: html };
  // }
}

function ensureSvgSrc(svgOrDataUrl: string) {
  if (svgOrDataUrl.trim().startsWith('<svg')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgOrDataUrl);
  }
  return svgOrDataUrl;
}
