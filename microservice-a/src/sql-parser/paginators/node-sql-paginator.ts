import { SqlPaginator } from '../interfaces/sql-paginator.interface';

export class NodeSqlPaginator implements SqlPaginator {
  private removePaginationFromQuery(query: string): string {
    // Remove existing LIMIT and OFFSET clauses (case insensitive)
    return query
      .replace(/\s+LIMIT\s+\d+/gi, '')
      .replace(/\s+OFFSET\s+\d+/gi, '')
      .trim();
  }

  addPaginationToSql(query: string, page: number, limit: number): string {
    const offset = (page - 1) * limit;
    const cleaned = query.trim().replace(/;$/, '');
    const cleanedQuery = this.removePaginationFromQuery(cleaned);

    const start = offset + 1;
    const end = offset + limit;

    return `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS row_num
        FROM (
          ${cleanedQuery}
        ) AS inner_query
      ) AS numbered
      WHERE row_num >= ${start} AND row_num <= ${end};
    `;
  }
}
