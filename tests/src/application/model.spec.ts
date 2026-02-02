import { Model, model, column } from '@/application';

describe('Model', () => {
  type UserTable = 'users';

  @model<UserTable>('users')
  class UserModel extends Model<UserTable> {
    @column('id')
    id!: string;

    @column('name_test')
    name!: string;

    constructor(input?: { id: string; name: string }) {
      super();
      if (input) {
        this.id = input.id;
        this.name = input.name;
      }
    }
  }

  it('registers table name on the model', () => {
    const modelInstance = new UserModel();

    expect(modelInstance.table).toBe('users');
  });

  it('registers columns on the model constructor', () => {
    const modelInstance = new UserModel();

    expect(modelInstance.columns).toEqual([
      { column: 'id', property: 'id' },
      { column: 'name_test', property: 'name' }
    ]);
  });

  it('allows assigning values through the constructor', () => {
    const modelInstance = new UserModel({ id: 'u-1', name: 'Ayla' });

    expect(modelInstance.id).toBe('u-1');
    expect(modelInstance.name).toBe('Ayla');
  });

  it('maps properties to a record using column names', () => {
    const modelInstance = new UserModel({ id: 'u-2', name: 'Luna' });

    expect(modelInstance.toPersistence()).toEqual({
      id: 'u-2',
      name_test: 'Luna'
    });
  });
});
