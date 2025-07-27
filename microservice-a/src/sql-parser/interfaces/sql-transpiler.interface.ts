export interface SqlTranspiler {
  transpile(sql: string): Promise<{ result?: string; error?: string }>;
}

export const SQL_TRANSPILER = Symbol('SQL_TRANSPILER');
