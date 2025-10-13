import { FileStorage } from './Repository';

export interface MetricRepository {
  metricMetricsSample(file: FileStorage): Promise<MetricsSample> | MetricsSample;
}

export interface MetricsSample {
  metrics(): Metric[];
}

export type Metric = {
  id: string;
  label: string;
  services: ServiceMetric[];
};

export type ServiceMetric = {
  level: number;
  label?: string;
};
