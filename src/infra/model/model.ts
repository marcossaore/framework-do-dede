import { Entity } from "@/application";

export type ColumnDefinition = {
  column: string
  property: string
};

export abstract class Model<TTable = string> {
  declare table: TTable;
  declare columns: ColumnDefinition[];
  [property: string]: any;

  constructor(input?: Record<string, any> | Entity) {
    if (!input) return;
    let data = {};
    if (input instanceof Entity) {
      data = input.from();
    } else {
      data = input;
    }
    for (const [property, value] of Object.entries(data)) {
      this[property] = value;
    }
  }

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
