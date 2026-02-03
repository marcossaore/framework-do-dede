import { Model, model, column, Entity } from '@/application';

describe('Model', () => {
  type UserTable = 'users';

  class Name {
    private value: string;
    constructor(value: string) {
      this.value = value;
    }

    getValue() {
      return this.value;
    }
  }

  class UserEntity extends Entity {

    private id: string;
    private name: Name;
    constructor(data: any) {
      super();
      this.id = data.id;
      this.name = new Name(data.name);
      this.generateGetters();
    }
  }

  @model<UserTable>('users')
  class UserModel extends Model<UserTable> {

    @column('id')
    id!: string;

    @column('name_test')
    name!: string;

    public toEntity(): Entity {
      return new UserEntity(this);
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

    expect(modelInstance.toModel()).toEqual({
      id: 'u-2',
      name_test: 'Luna'
    });
  });

  it('maps properties to a entity instance toEntity', () => {
    const modelInstance = new UserModel({ id: 'u-3', name: 'Luna' });

    expect(modelInstance.toEntity()).toBeInstanceOf(UserEntity);
    expect(modelInstance.toEntity().getId()).toBe('u-3');
    expect(modelInstance.toEntity().getName().getValue()).toBe('Luna');
  });
});
