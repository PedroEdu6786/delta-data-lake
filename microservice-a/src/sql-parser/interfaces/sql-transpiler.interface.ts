export interface SqlTranspiler {
  toTrino(sql: string): Promise<{ result?: string; error?: string }>;
}
