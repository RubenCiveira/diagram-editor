import { FormDefinition, NodeActionItem } from '../metadata/FormDefinition';

export type FormResult<T> = {
  data: T;
  title: string;
  accepted: boolean;
}

export type ReportDetails = {
  html: string;
  title?: string;
  menu?: Promise<NodeActionItem[]> | NodeActionItem[];
  actions?: Promise<NodeActionItem[]> | NodeActionItem[];
}

export type ReportResult = {
  closed: true;
}

export type FormDetail<T> = {
  // id?: string;
  value?: T;
  title?: string;
  menu?: Promise<NodeActionItem[]> | NodeActionItem[];
  definition: FormDefinition | Promise<FormDefinition>;
  actions?: Promise<NodeActionItem[]> | NodeActionItem[];
  warns?: string[];
  errors?: string[];
};

export interface DiagramRender {
  showReport(details: ReportDetails): Promise<ReportResult>;
  showEdit<T>(props: FormDetail<T>): Promise<FormResult<T>>;
}
