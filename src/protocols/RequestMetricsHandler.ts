import { RequestMetrics } from "@/handlers/controller.handler";
import type { RequestData } from './RequestData'


export interface RequestMetricsHandler {
    handle(metrics: RequestMetrics, request?: RequestData): Promise<void> | void;
}