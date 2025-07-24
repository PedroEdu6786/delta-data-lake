export interface QueryEngine {
  runQuery(query: string, tableName: string): Promise<object>;
  getTableNames(query: string): string[]; // useful for permission checking
}

export const QUERY_ENGINE = Symbol('QUERY_ENGINE');
