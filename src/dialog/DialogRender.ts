import { DiagramRender, FormDetail, FormResult, ReportDetails, ReportResult } from './model';
import { getDiagramRender } from './dialogGateway';

export class DialogRender implements DiagramRender {
  showReport(details: ReportDetails): Promise<ReportResult> {
    return getDiagramRender().showReport(details);
  }
  showEdit<T>(props: FormDetail<T>): Promise<FormResult<T>> {
    return getDiagramRender().showEdit(props);
  }
}
