import { Injectable } from '@nestjs/common';
import { AstTableExtractor } from './extractors/ast-table-extractor';
import { PythonSqlTranspiler } from './transpilers/python-sql-transpiler';
import { NodeSqlPaginator } from './paginators/node-sql-paginator';

@Injectable()
export class SqlParserService {
  private readonly tableExtractor = new AstTableExtractor();
  private readonly sqlTranspiler = new PythonSqlTranspiler();
  private readonly sqlPaginator = new NodeSqlPaginator();

  extractTableNames(sql: string): string[] {
    return this.tableExtractor.extractTableNames(sql);
  }

  async toTrino(sql: string): Promise<{ result?: string; error?: string }> {
    return this.sqlTranspiler.toTrino(sql);
  }

  addPaginationToSql(query: string, limit: number, offset: number): string {
    return this.sqlPaginator.addPaginationToSql(query, limit, offset);
  }
}
