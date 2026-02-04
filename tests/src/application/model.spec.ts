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
      return new UserEntity({ id: this.id, name: this.name });
    }

    public fromEntity(entity: Entity): Model {
      this.id = entity.id;
      this.name = entity.name.getValue();
      return this;
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

  it('maps column names to properties when using fromModel', () => {
    const modelInstance = new UserModel().fromModel({ id: 'u-1', name_test: 'Ayla' });

    expect(modelInstance.id).toBe('u-1');
    expect(modelInstance.name).toBe('Ayla');
  });

  it('assigns unknown properties when using fromModel', () => {
    const modelInstance = new UserModel().fromModel({ id: 'u-2', name_test: 'Luna', status: 'active' });

    expect(modelInstance.id).toBe('u-2');
    expect(modelInstance.name).toBe('Luna');
    expect(modelInstance.status).toBe('active');
  });

  it('maps properties to a record using column names and keeps non-mapped fields', () => {
    const modelInstance = new UserModel().fromModel({ id: 'u-3', name_test: 'Luna', role: 'admin' });

    expect(modelInstance.toModel()).toEqual({
      id: 'u-3',
      name_test: 'Luna',
      role: 'admin'
    });
  });

  it('omits internal metadata fields from toModel', () => {
    const modelInstance = new UserModel().fromModel({ id: 'u-4', name_test: 'Luna' });
    (modelInstance as any).table = 'users';
    (modelInstance as any).columns = [
      { column: 'id', property: 'id' },
      { column: 'name_test', property: 'name' }
    ];

    expect(modelInstance.toModel()).toEqual({
      id: 'u-4',
      name_test: 'Luna'
    });
  });

  it('converts between model and entity', () => {
    const modelInstance = new UserModel().fromModel({ id: 'u-5', name_test: 'Sami' });
    const entity = modelInstance.toEntity();

    expect(entity).toBeInstanceOf(UserEntity);
    expect(entity.getId()).toBe('u-5');
    expect(entity.getName().getValue()).toBe('Sami');

    const roundTripModel = new UserModel().fromEntity(entity);
    expect(roundTripModel.id).toBe('u-5');
    expect(roundTripModel.name).toBe('Sami');
  });
});
