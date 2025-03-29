import { RequestMetrics } from "@/handlers/controller.handler";

export interface RequestMetricsHandler {
    handle(metrics: RequestMetrics): Promise<void> | void;
}