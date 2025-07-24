export interface QueryEngine {
  runQuery(
    query: string,
    tableName: string,
  ): AsyncGenerator<Record<string, any>, void>;
  getTableNames(query: string): string[]; // useful for permission checking
}

export const QUERY_ENGINE = Symbol('QUERY_ENGINE');
