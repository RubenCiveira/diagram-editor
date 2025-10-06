import { DiagramDescriptor } from '../diagram/descriptor';

export type ActionItem = {
  id: string;
  title: string;
  danger?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;

  exec(graph: DiagramDescriptor): Promise<void> | void;

  // definition?(): void | FormDefinition | Promise<FormDefinition>;
  // run: (graph: DiagramModel, data: any, svg: any) => ActionResult | Promise<ActionResult>;
};

export type ActionResult = {
  content?: string;
};
