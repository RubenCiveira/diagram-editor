import { DiagramRender, FormDetail, FormResult, ReportResult } from '../diagram/render';
import { getDiagramRender } from './dialogGateway';

export class DialogRender implements DiagramRender {
  showReport(html: string): Promise<ReportResult> {
    return getDiagramRender().showReport(html);
  }
  showEdit<T>(props: FormDetail<T>): Promise<FormResult<T>> {
    return getDiagramRender().showEdit(props);
  }
}
