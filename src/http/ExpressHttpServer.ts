// @ts-ignore 
import express from "express";
import HttpServer from "./HttpServer";

const app = express()

export class ExpressHttpServer extends HttpServer {
    
    constructor(uses?: CallableFunction[]) {
        super(app, 'express')
        this.framework.use(express.json());
        uses?.forEach(use => this.framework.use(use))
    }

    listen(port: number): void {
        super.listen(port)
        console.log(`Server listening on port ${port}`)
    }
}
