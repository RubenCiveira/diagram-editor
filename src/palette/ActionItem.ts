import { DiagramModel } from '../diagram';
import { FormDefinition } from '../metadata/FormDefinition';

export type ActionItem = {
  id: string;
  title: string;
  danger?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  definition?(): void | FormDefinition | Promise<FormDefinition>;
  run: (graph: DiagramModel, data: any, svg: any) => ActionResult | Promise<ActionResult>;
};

export type ActionResult = {
  content?: string;
};
