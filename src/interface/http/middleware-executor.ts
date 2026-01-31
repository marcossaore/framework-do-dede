import type { Request } from "@/http/http-server";
import type { Middleware } from "@/application/controller";

export type ExecutedMiddleware = { elapsedTime: string; middleware: string; error?: any };

export class MiddlewareExecutor {
  async execute(middlewares: Middleware[] = [], request: Request): Promise<ExecutedMiddleware[]> {
    const executed: ExecutedMiddleware[] = [];
    if (middlewares && middlewares.length > 0) {
      for (const middleware of middlewares) {
        let startTime = 0;
        let endTime = 0;
        let elapsedTime;
        try {
          startTime = performance.now();
          const middlewareResult = await middleware.execute(request);
          request.context = Object.assign(request.context, middlewareResult);
          endTime = performance.now();
          elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;
          executed.push({
            elapsedTime,
            middleware: middleware.constructor.name,
          });
        } catch (error) {
          elapsedTime = `${(endTime - startTime).toFixed(2)} ms`;
          executed.push({
            elapsedTime,
            middleware: middleware.constructor.name,
            error,
          });
          throw error;
        }
      }
    }
    return executed;
  }
}
