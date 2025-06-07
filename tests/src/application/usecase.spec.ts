import { UseCase } from '@/application/usecase';
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
});