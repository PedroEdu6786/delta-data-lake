export interface TableExtractor {
  extractTableNames(sql: string): string[];
}
