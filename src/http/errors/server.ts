export { AppError as ServerError } from "@/domain/errors/app-error";
export { BadRequest, NotFound, Forbidden, Conflict, Unauthorized, UnprocessableEntity, InternalServerError } from "@/domain/errors/http-errors";
export class CustomServerError extends Error {
  private statusCode: number
  private custom: any
  constructor(custom: any, statusCode: number, nameError: string = '') {
    super()
    this.name = nameError || this.constructor.name
    this.statusCode = statusCode
    this.custom = custom
  }

  getStatusCode() {
    return this.statusCode
  }
  getCustom(): any {
    return this.custom
  }
}
