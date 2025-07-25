export interface QueryEngine {
  runQuery(
    query: string,
    tables: string[],
  ): AsyncGenerator<Record<string, any>, void>;
}

export const QUERY_ENGINE = Symbol('QUERY_ENGINE');
