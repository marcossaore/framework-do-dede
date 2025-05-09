import type { Request } from './Request'
import type { RequestMetrics } from './RequestMetrics';


export interface RequestMetricsHandler {
    handle(metrics: RequestMetrics, request?: Request): Promise<void> | void;
}