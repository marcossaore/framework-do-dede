// @ts-ignore 
import express from "express";
import HttpServer from "./http-server";

const app = express()

export class ExpressServerAdapter extends HttpServer {
    async close(): Promise<void> {

        const shutDown = () => {
            (this.framework as any).close(() => {
                console.log("Server closed. Cleanup complete.");
                process.exit(0);
            });
        }
        process.on("SIGINT", shutDown);
        process.on("SIGTERM", shutDown);
    }

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
