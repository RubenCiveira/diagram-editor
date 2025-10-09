import { FormDefinition, NodeActionItem } from '../../../../metadata/FormDefinition';
import { ActionItem } from '../../../ActionItem';
import { DiagramDescriptor } from '../../../../diagram/descriptor';
import { DialogRender } from '../../../../dialog/DialogRender';
import { BuildDiagramReport } from './BuildDiagramReport';
import { CheckPending } from '../contextuals/CheckPending';
import { Deploy } from '../contextuals/Deploy';
import { DeployConfig } from '../contextuals/DeployConfig';
import { Merge } from '../contextuals/Merge';

export class ExportDetails implements ActionItem {
  id = 'export-html';
  title = 'Exportar resumen (HTML)';
  subtitle = 'Genera un documento con índice, propiedades y relaciones';

  public constructor(private readonly render: DialogRender) {}

  async exec(graph: DiagramDescriptor): Promise<void> {
    const data = await this.render.showEdit({
      value: {},
      definition: this.definition(),
    });
    if (data.accepted) {
      const builder = new BuildDiagramReport(graph);
      const svg = await graph.toSvg();
      const html = builder.buildDiagramHTML(ensureSvgSrc(svg));
      this.render.showReport({
        html: html,
        menu: this.getMoreMenuActions(),
        actions: this.getHeaderActions(),
      });
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

  getHeaderActions(): NodeActionItem[] {
    return [new CheckPending({ url: '', disabled: false })];
  }

  getMoreMenuActions(): NodeActionItem[] {
    return [
      new Merge({ url: '', disabled: false }),
      new Deploy({ url: '', disabled: false }),
      new DeployConfig({ url: '', disabled: false }),
    ];
  }
}

function ensureSvgSrc(svgOrDataUrl: string) {
  if (svgOrDataUrl.trim().startsWith('<svg')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgOrDataUrl);
  }
  return svgOrDataUrl;
}
