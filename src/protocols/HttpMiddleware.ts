export default interface HttpMiddleware {
    execute(input: any): Promise<any>
  }
  