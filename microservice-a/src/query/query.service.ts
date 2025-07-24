import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
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

  async runQuery(token: string, query: string, page: number, limit: number) {
    const tables = this.extractAndValidateTables(query);
    const [tableName] = tables;

    const access = await this.permissionsService.checkAccess(token, tables);
    if (!access.allowed) {
      throw new ForbiddenException('Access denied to requested tables');
    }

    const trinoQuery = await this.transpileToTrino(query);

    return this.executeQuery(trinoQuery, tableName, page, limit);
  }

  private extractAndValidateTables(query: string): string[] {
    const tables = this.sqlParser.extractTableNames(query);

    if (!tables || tables.length === 0) {
      throw new NotFoundException('No tables found in query');
    }

    if (tables.length > 1) {
      throw new BadRequestException('Multiple tables not supported');
    }

    return tables;
  }

  private async transpileToTrino(query: string): Promise<string> {
    try {
      const result = await this.sqlParser.toTrino(query);
      if (!result.result) {
        throw new ForbiddenException('Failed to transpile query to Trino');
      }
      return result.result;
    } catch (error) {
      console.error('Transpilation to Trino failed:', error);
      throw error;
    }
  }

  private async executeQuery(
    query: string,
    tableName: string,
    page: number,
    limit: number,
  ): Promise<object> {
    try {
      return this.queryEngine.runQuery(query, tableName, page, limit);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }
}
