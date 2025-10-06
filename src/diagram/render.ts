import { FormDefinition } from '../metadata/FormDefinition';
import { NodeActionItem } from '../palette/DiagramElementType';

export type FormResult<T> = {
  data: T;
  accepted: boolean;
}

export type ReportResult = {
  closed: true;
}

export type FormDetail<T> = {
  id?: string;
  value?: T;
  title?: string;
  menu?: Promise<NodeActionItem[]> | NodeActionItem[];
  definition: FormDefinition | Promise<FormDefinition>;
  actions?: Promise<NodeActionItem[]> | NodeActionItem[];
  warns?: string[];
  errors?: string[];
};

export interface DiagramRender {
  showReport(html: string): Promise<ReportResult>;
  showEdit<T>(props: FormDetail<T>): Promise<FormResult<T>>;
}
