import { AST, Parser } from 'node-sql-parser';
import { SqlPaginator } from '../interfaces/sql-paginator.interface';

export class NodeSqlPaginator implements SqlPaginator {
  private readonly parser = new Parser();
  private readonly dialect = 'hive';

  addPaginationToSql(query: string, limit: number, offset: number): string {
    const ast = this.parseQuery(query);
    this.validateSelectQuery(ast);
    this.addLimitOffset(ast, limit, offset);

    const sql = this.parser.sqlify(ast, { database: this.dialect });
    return sql.endsWith(';') ? sql : sql + ';';
  }

  private parseQuery(query: string): AST {
    try {
      let ast = this.parser.astify(query, { database: this.dialect });

      if (Array.isArray(ast)) {
        if (ast.length !== 1) {
          throw new Error('Only single SELECT queries are supported.');
        }
        ast = ast[0];
      }

      return ast;
    } catch {
      throw new Error(`Invalid SQL`);
    }
  }

  private validateSelectQuery(ast: AST): void {
    if (ast.type !== 'select') {
      throw new Error('Only SELECT queries can be paginated.');
    }
  }

  private addLimitOffset(ast: AST, limit: number, offset: number): void {
    ast['limit'] = {
      seperator: ' OFFSET',
      value: [
        { type: 'number', value: limit },
        { type: 'number', value: offset },
      ],
    };
  }
}
