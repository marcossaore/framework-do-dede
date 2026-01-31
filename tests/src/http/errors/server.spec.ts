import { BadRequest, Conflict, CustomServerError, Forbidden, NotFound, ServerError, Unauthorized, UnprocessableEntity, InternalServerError } from '@/http/errors/server';

  // Test subclass to validate abstract class behavior
  class TestServerError extends ServerError {
    constructor(message: string, statusCode: number) {
      super(message, statusCode, { message });
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

  describe('CustomServerError', () => {
    it('should store status code and custom payload', () => {
      const custom = { message: 'Custom error', reason: 'validation', code: 'E_CUSTOM' };
      const error = new CustomServerError(custom, 422, 'UnprocessableEntity');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomServerError);
      expect(error.name).toBe('UnprocessableEntity');
      expect(error.getStatusCode()).toBe(422);
      expect(error.getCustom()).toBe(custom);
    });

    it('should allow non-object payloads', () => {
      const custom = 'Custom error string';
      const error = new CustomServerError(custom, 400);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomServerError);
      expect(error.name).toBe('CustomServerError');
      expect(error.getCustom()).toBe(custom);
      expect(error.getStatusCode()).toBe(400);
    });

    it('should allow overriding error name', () => {
      const custom = { message: 'Custom error' };
      const error = new CustomServerError(custom, 400, 'ValidationError');
      expect(error.name).toBe('ValidationError');
    });

    it('should fallback to class name when name is empty', () => {
      const custom = { message: 'Custom error' };
      const error = new CustomServerError(custom, 400, '');
      expect(error.name).toBe('CustomServerError');
    });
  });

  describe('InternalServerError', () => {
    it('should store unexpected error message', () => {
      const error = new InternalServerError('debug message', 'default message');
      expect(error.getUnexpectedError()).toBe('debug message');
      expect(error.getStatusCode()).toBe(500);
      expect(error.message).toBe('default message');
    });
  });
});
