import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { QUERY_ENGINE, QueryEngine } from './types/query-engine.interface';
import { PermissionsService } from 'src/permissions/permissions.service';
import { SqlParserService } from 'src/sql-parser/sql-parser.service';

@Injectable()
export class QueryService {
  constructor(
    @Inject(QUERY_ENGINE)
    private readonly queryEngine: QueryEngine,
    private readonly sqlParser: SqlParserService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async runQuery(token: string, query: string, page = 1, limit = 50) {
    const tables = this.extractAndValidateTables(query);
    const [tableName] = tables;

    try {
      const access = await this.permissionsService.checkAccess(token, tables);
      if (!access.allowed) {
        throw new ForbiddenException('Access denied to requested tables');
      }
      const trinoQuery = await this.transpileToTrino(query);

      const paginatedQuery = this.sqlParser.addPaginationToSql(
        trinoQuery,
        page,
        limit,
      );

      return this.executeQuery(paginatedQuery, tableName);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  private extractAndValidateTables(query: string): string[] {
    const tables = this.sqlParser.extractTableNames(query);

    if (tables.length > 1) {
      throw new BadRequestException('Multiple tables not supported');
    }

    return tables;
  }

  private async transpileToTrino(query: string): Promise<string> {
    try {
      const result = await this.sqlParser.toTrino(query);
      if (!result.result) {
        throw new BadRequestException({
          message: 'Failed to transpile query to Trino, invalid query',
          details: result.error,
        });
      }
      return result.result;
    } catch (error) {
      console.error('Transpilation to Trino failed:', error);
      throw error;
    }
  }

  private executeQuery(query: string, tableName: string) {
    try {
      return this.queryEngine.runQuery(query, tableName);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }
}
