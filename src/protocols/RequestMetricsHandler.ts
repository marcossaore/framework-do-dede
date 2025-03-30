import type { RequestData } from './RequestData'
import type { RequestMetrics } from './RequestMetrics';


export interface RequestMetricsHandler {
    handle(metrics: RequestMetrics, request?: RequestData): Promise<void> | void;
}