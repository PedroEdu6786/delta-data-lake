export interface SqlPaginator {
  addPaginationToSql(query: string, limit: number, offset: number): string;
}
