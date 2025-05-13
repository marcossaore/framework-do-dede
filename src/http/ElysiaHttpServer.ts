// @ts-ignore 
import Elysia from "elysia";
import HttpServer from "./HttpServer";

export class ElysiaHttpServer extends HttpServer {
    async close(): Promise<void> {
        await (this.framework as Elysia).stop()
        console.log('server closed')
    }
    
    constructor(uses?: CallableFunction[]) {
        super(new Elysia(), 'elysia')
        uses?.forEach(use => this.framework.use(use))
    }

    listen(port: number): void {
        super.listen(port)
        console.log(`Server listening on port ${port}`)
    }
}
