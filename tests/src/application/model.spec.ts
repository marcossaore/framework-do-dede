import { Entity, Model } from '@/application';

describe('Model', () => {
  class User extends Entity {
    private readonly id: string;
    private readonly name: string;

    private constructor({ id, name }: { id: string; name: string }) {
      super();
      this.id = id;
      this.name = name;
      this.generateGetters();
    }

    static create(name: string) {
      return new User({ id: 'user-1', name });
    }

    static restore(input: { id: string; name: string }) {
      return new User(input);
    }
  }

  type UserRow = { id: string; name: string };

  class UserModel extends Model<User, UserRow> {
    toModel(entity: User): UserRow {
      return { id: entity.getId(), name: entity.getName() };
    }

    toEntity(model: UserRow): User {
      return User.restore(model);
    }
  }

  it('converts between entity and model', () => {
    const model = new UserModel();
    const entity = User.create('Ayla');

    expect(model.toModel(entity)).toEqual({ id: 'user-1', name: 'Ayla' });
    expect(model.toEntity({ id: 'user-2', name: 'Ana' }).getName()).toBe('Ana');
  });

  it('converts lists of entities and models with array maps', () => {
    const model = new UserModel();
    const entities = [User.create('Lia'), User.create('Noah')];

    const rows = entities.map((entity) => model.toModel(entity));

    expect(rows).toEqual([
      { id: 'user-1', name: 'Lia' },
      { id: 'user-1', name: 'Noah' }
    ]);

    const restored = [
      { id: 'u-1', name: 'Beto' },
      { id: 'u-2', name: 'Rafa' }
    ].map((row) => model.toEntity(row));

    expect(restored[0].getId()).toBe('u-1');
    expect(restored[1].getName()).toBe('Rafa');
  });
});
