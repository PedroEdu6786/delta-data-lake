import { Inject, Injectable } from '@nestjs/common';
import { SqlParserService } from 'src/sql-parser/sql-parser.service';
import { QUERY_ENGINE, QueryEngine } from './types/query-engine.interface';

@Injectable()
export class QueryService {
  constructor(
    @Inject(QUERY_ENGINE)
    private readonly queryEngine: QueryEngine,
    private readonly sqlParser: SqlParserService,
    // private readonly cacheService: CacheService,
  ) {}

  async runQuery(sql: string, page: number, limit: number) {
    // const tables = this.sqlParser.extractTableNames(sql);

    // const allowed = await this.permissionService.checkAccess(userId, tables);
    // if (!allowed) throw new ForbiddenException();

    // const cached = await this.cacheService.get(sql, userId);
    // if (cached) return cached;

    const result = await this.queryEngine.runQuery(sql, page, limit);

    // await this.cacheService.set(sql, userId, result);
    return result;
  }
}
