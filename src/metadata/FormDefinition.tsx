import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { ReactNode } from 'react';

export type FormDefinition = {
  ui?: UiSchema;
  schema?: RJSFSchema | TabPage[];
}

export type TabPage = {
  type: 'tabs';
  id: string;
  icon: string;
  title: string;
  description?: string;
  information?: string;
  schema: RJSFSchema;
  ui?: UiSchema;
}

export interface NodeActionItem {
  readonly disabled?: boolean;
  readonly title?: string;
  readonly label?: string;
  readonly icon?: ReactNode;
  readonly danger?: boolean;

  onClick(): Promise<void> | void;
}