import { Module } from '@nestjs/common';
import { AstTableExtractor } from './extractors/ast-table-extractor';
import { NodeSqlPaginator } from './paginators/node-sql-paginator';
import { PythonSqlTranspiler } from './transpilers/python-sql-transpiler';

@Module({
  providers: [AstTableExtractor, PythonSqlTranspiler, NodeSqlPaginator],
  exports: [AstTableExtractor, PythonSqlTranspiler, NodeSqlPaginator],
})
export class SqlParserModule {}
