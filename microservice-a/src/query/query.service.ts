import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { QUERY_ENGINE, QueryEngine } from './types/query-engine.interface';
import { PermissionsService } from 'src/permissions/permissions.service';

import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AstTableExtractor } from 'src/sql-parser/extractors/ast-table-extractor';
import { NodeSqlPaginator } from 'src/sql-parser/paginators/node-sql-paginator';
import {
  SQL_TRANSPILER,
  SqlTranspiler,
} from 'src/sql-parser/interfaces/sql-transpiler.interface';

@Injectable()
export class QueryService {
  constructor(
    @Inject(QUERY_ENGINE)
    private readonly queryEngine: QueryEngine,
    private readonly tableExtractor: AstTableExtractor,
    private readonly sqlPaginator: NodeSqlPaginator,
    @Inject(SQL_TRANSPILER)
    private readonly sqlTranspiler: SqlTranspiler,
    private readonly permissionsService: PermissionsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async runQuery(token: string, query: string, page = 1, limit = 50) {
    const tables = this.tableExtractor.extractTableNames(query);

    try {
      const access = await this.permissionsService.checkAccess(token, tables);
      if (!access.allowed) {
        this.logger.warn('Access denied to requested tables', {
          deniedTables: access.deniedTables,
        });
        throw new ForbiddenException('Access denied to requested tables');
      }
      const transpiledQuery = await this.transpileQuery(query);

      const paginatedQuery = this.sqlPaginator.addPaginationToSql(
        transpiledQuery,
        page,
        limit,
      );

      return this.executeQuery(paginatedQuery, tables);
    } catch (error) {
      this.logger.error('Query execution failed', { error });
      throw error;
    }
  }

  private async transpileQuery(query: string): Promise<string> {
    try {
      const result = await this.sqlTranspiler.transpile(query);
      if (!result.result) {
        throw new BadRequestException({
          message: 'Failed to transpile query to Trino, invalid query',
          details: result.error,
        });
      }
      return result.result;
    } catch (error) {
      this.logger.error('Transpilation to Trino failed', { error });
      throw error;
    }
  }

  private executeQuery(query: string, tableName: string[]) {
    try {
      return this.queryEngine.runQuery(query, tableName);
    } catch (error) {
      this.logger.error('Query execution failed', { error });
      throw error;
    }
  }
}
