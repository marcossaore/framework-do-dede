import { Entity } from "@/application";

export type ColumnDefinition = {
  column: string
  property: string
};

export abstract class Model<TTable = string> {
  declare table: TTable;
  declare columns: ColumnDefinition[];
  [property: string]: any;

  fromModel(input: Record<string, any>): Model {
    const columns = this.columns ?? [];
    const columnByName = new Map(columns.map((column) => [column.column, column.property]));
    for (const [property, value] of Object.entries(input)) {
      const mappedProperty = columnByName.get(property);
      this[mappedProperty ?? property] = value;
    }
    return this as Model;
  }

  public abstract fromEntity(entity: Entity): Model;

  toModel(): Record<string, any> {
    const record: Record<string, any> = {};
    const columns = this.columns ?? [];
    const mappedProperties = new Set<string>();
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
    return record;
  }

  public abstract toEntity(): Entity;
}

export function model<TTable>(table: TTable) {
  return function (target: any) {
    target.prototype.table = table;
  };
}

export function column(columnName: string) {
  return function (target: any, propertyKey: string) {
    target.columns = target.columns || [];
    target.columns.push({ column: columnName, property: propertyKey });
  };
}
