import Elysia from "elysia";
import HttpServer from "./HttpServer";

export class ElysiaHttpServer extends HttpServer {
    
    constructor(uses?: CallableFunction[]) {
        super(new Elysia(), 'elysia')
        uses?.forEach(use => this.framework.use(use))
    }

    listen(port: number): void {
        super.listen(port)
        console.log(`Server listening on port ${port}`)
    }
}
