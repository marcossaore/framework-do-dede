export type ColumnDefinition = {
  column: string
  property: string
};

export abstract class Model<TTable = string> {
  declare table: TTable;
  declare columns: ColumnDefinition[];
  [property: string]: any;

  toPersistence(): Record<string, any> {
    const record: Record<string, any> = {};
    const columns = this.columns ?? [];
    for (const column of columns) {
      record[column.column] = this[column.property];
    }
    return record;
  }
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
