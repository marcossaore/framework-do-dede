import { DecorateUseCase, USE_CASE_DECORATORS, UseCase } from '@/application/usecase';
import 'reflect-metadata';

describe('UseCase', () => {
  it('should be able to get data passed to use case', async () => {
    class CreateUser extends UseCase<any, any> {
      execute(): Promise<any> {
        const data = this.getData();
        return Promise.resolve({
          token: data.token
        });
      }
    }
    const useCase = new CreateUser({ data: { token: '123' } });
    const result = await useCase.execute();

    expect(result).toEqual({
      token: '123'
    });
  });

  it('should be able to get context passed to use case', async () => {
    class CreateUser extends UseCase<any, any> {

      execute(): Promise<any> {
        const data = this.getData();
        return Promise.resolve({
          token: data.token,
          id: this.getContext().auth.getId()
        });
      }
    }
    const useCase = new CreateUser({ data: { token: '123' }, context: { auth: { getId: () => 1 } } });
    const result = await useCase.execute();
    expect(result).toEqual({
      token: '123',
      id: 1
    });
  });

  it('should be able to decorate use case', async () => {
    class DecorateSample extends UseCase<any, any> {
      execute(): Promise<any> {
        return Promise.resolve({});
      }
    }
    @DecorateUseCase(DecorateSample)
    class CreateUser extends UseCase<any, any> {
      execute(): Promise<any> {
        return Promise.resolve({});
      }
    }

    const metadata = Reflect.getMetadata(USE_CASE_DECORATORS, CreateUser);
    expect(metadata).toEqual([DecorateSample]);
  });

  it('should be able to decorate multiple use cases', async () => {
    class DecorateSample1 extends UseCase<any, any> {
      execute(): Promise<any> {
        return Promise.resolve({});
      }
    }

    class DecorateSample2 extends UseCase<any, any> {
      execute(): Promise<any> {
        return Promise.resolve({});
      }
    }

    @DecorateUseCase([DecorateSample1, DecorateSample2])
    class CreateUser extends UseCase<any, any> {
      execute(): Promise<any> {
        return Promise.resolve({});
      }
    }

    const metadata = Reflect.getMetadata(USE_CASE_DECORATORS, CreateUser);
    expect(metadata).toEqual([DecorateSample1, DecorateSample2]);
  });
});