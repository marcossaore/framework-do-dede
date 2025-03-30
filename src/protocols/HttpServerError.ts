import { HttpStatusCode } from "@/http/HttpServer";

export interface HttpServerError {
    message: string;
    statusCode: HttpStatusCode
}