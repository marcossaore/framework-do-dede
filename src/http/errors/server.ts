export abstract class ServerError extends Error {
    private statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.name = this.constructor.name
      this.statusCode = statusCode
    }
  
    getStatusCode() {
      return this.statusCode
    }
  }
  
  export class NotFound extends ServerError {
    constructor(message: string) {
      super(message, 404)
    }
  }
  
  export class Forbidden extends ServerError {
    constructor(message: string) {
      super(message, 403)
    }
  }
  
  export class UnprocessableEntity extends ServerError {
    constructor(message: string) {
      super(message, 422)
    }
  }

  export class Conflict extends ServerError {
    constructor(message: string) {
      super(message, 409)
    }
  }
  
  
  export class Unauthorized extends ServerError {
    constructor(message: string) {
      super(message, 401)
    }
  }
  
  export class BadRequest extends ServerError {
    constructor(message: string) {
      super(message, 400)
    }
  }

  export class InternalServerError extends ServerError {
    private unexpectedError: string;
    constructor(unexpectedError: string, defaultMessage: string = 'Ops, An unexpected error occurred') {
      super(defaultMessage, 500)
      this.unexpectedError = unexpectedError; 
    }

    getUnexpectedError() {
      return this.unexpectedError;
    }
  }
  