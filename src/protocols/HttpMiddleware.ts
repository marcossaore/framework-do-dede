export type HttpMiddleware = {
    execute(input: any): Promise<any>
  }
  