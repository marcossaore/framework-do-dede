import { BadRequest, Conflict, Forbidden, NotFound, ServerError, Unauthorized, UnprocessableEntity } from '@/http/ServerError';

  // Test subclass to validate abstract class behavior
  class TestServerError extends ServerError {
    constructor(message: string, statusCode: number) {
      super(message, statusCode);
    }
  }
  
  describe('ServerError Hierarchy', () => {
    describe('Base Class (ServerError)', () => {
      it('should create instances with message and status code', () => {
        const error = new TestServerError('Test message', 418);
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ServerError);
        expect(error.message).toBe('Test message');
        expect(error.getStatusCode()).toBe(418);
      });
  
      it('should have proper error name', () => {
        const error = new TestServerError('Test', 400);
        console.log('error.name = ', error.name);
        expect(error.name).toBe('TestServerError');
      });
    });
  
    describe('Concrete Error Classes', () => {
      const testCases = [
        {
          class: NotFound,
          name: 'NotFound',
          status: 404,
          message: 'Resource not found'
        },
        {
          class: Forbidden,
          name: 'Forbidden',
          status: 403,
          message: 'Access denied'
        },
        {
          class: UnprocessableEntity,
          name: 'UnprocessableEntity',
          status: 422,
          message: 'Validation failed'
        },
        {
          class: Conflict,
          name: 'Conflict',
          status: 409,
          message: 'Resource conflict'
        },
        {
          class: Unauthorized,
          name: 'Unauthorized',
          status: 401,
          message: 'Authentication required'
        },
        {
          class: BadRequest,
          name: 'BadRequest',
          status: 400,
          message: 'Invalid request'
        },
      ];
  
      testCases.forEach(({ class: ErrorClass, name, status, message }) => {
        describe(name, () => {
          it('should have correct inheritance', () => {
            const error = new ErrorClass(message);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ServerError);
            expect(error).toBeInstanceOf(ErrorClass);
          });
  
          it('should store and return status code', () => {
            const error = new ErrorClass(message);
            expect(error.getStatusCode()).toBe(status);
          });
  
          it('should have proper error name', () => {
            const error = new ErrorClass(message);
            expect(error.name).toBe(name);
          });
  
          it('should store and display message', () => {
            const error = new ErrorClass(message);
            expect(error.message).toBe(message);
          });
        });
      });
    });
  
    describe('Error Messages', () => {
      it('should handle empty messages', () => {
        const error = new NotFound('');
        expect(error.message).toBe('');
      });
  
      it('should handle complex messages', () => {
        const complexMessage = 'Error with ID: 12345\nContact support';
        const error = new Forbidden(complexMessage);
        expect(error.message).toBe(complexMessage);
      });
    });
  });