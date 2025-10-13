import { FileStorage } from './Repository';

export interface TraceRepository {
  searchTracesSample(file: FileStorage): Promise<TracesSample> | TracesSample;
}

export interface TracesSample {
  traces(): Trace[];
}

export type Trace = {
  id: string;
  label: string;
  source: string;
  target: string;
  sourceHandle?: string;
  trargetHandle?: string;
  activate: boolean;
  props: any;
  message?: string;
};
