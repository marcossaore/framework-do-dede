import { Entity } from '@/domain/entity';

export abstract class Model<E extends Entity, D> {
  abstract toModel(entity: E): D;
  abstract toEntity(model: D): E;
}
