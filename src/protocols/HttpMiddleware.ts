export interface HttpMiddleware {
    execute(input: any): Promise<any>
}
  