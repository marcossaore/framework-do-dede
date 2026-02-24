import { Entity } from "@/infra/serialization/entity";
import { RepositoryModel } from "@/protocols/model";

export type ColumnDefinition = {
  column: string
  property: string
};

export abstract class Model<TEntity extends Entity = Entity> extends RepositoryModel<TEntity> {
  declare columns: ColumnDefinition[];
  [property: string]: any;

  fromModel(input: Record<string, any> | null | undefined): this {
    if (input === null || input === undefined) {
      return this;
    }
    const columns = this.columns ?? [];
    const columnByName = new Map(columns.map((column) => [column.column, column.property]));
    for (const [property, value] of Object.entries(input)) {
      const mappedProperty = columnByName.get(property);
      this[mappedProperty ?? property] = value;
    }
    return this;
  }

  public abstract fromEntity(entity: TEntity): this;

  toModel(ignoreId = false, namedId?: string): Record<string, any> {
    const record: Record<string, any> = {};
    const columns = this.columns ?? [];
    const mappedProperties = new Set<string>();
    const idColumn = columns.find((column) => column.property === "id")?.column ?? "id";
    for (const column of columns) {
      record[column.column] = this[column.property];
      mappedProperties.add(column.property);
    }
    for (const property of Object.keys(this)) {
      if (property === "table" || property === "columns") {
        continue;
      }
      if (mappedProperties.has(property)) {
        continue;
      }
      record[property] = this[property];
    }
    const idValue = (this as any).id ?? record[idColumn];
    if (namedId && idValue !== undefined) {
      record[namedId] = idValue;
    }
    if (ignoreId) {
      delete record[idColumn];
    }
    return record;
  }

  public abstract toEntity(): TEntity;
}

export function column(columnName: string) {
  return function (target: any, propertyKey: string) {
    target.columns = target.columns || [];
    target.columns.push({ column: columnName, property: propertyKey });
  };
}
