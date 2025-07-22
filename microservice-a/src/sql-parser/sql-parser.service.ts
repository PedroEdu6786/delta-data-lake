import { Injectable } from '@nestjs/common';
import { Parser } from 'node-sql-parser';

@Injectable()
export class SqlParserService {
  extractTableNames(sql: string): string[] {
    const parser = new Parser();
    const ast = parser.astify(sql);
    // Extract logic will depend on query shape; keep simple for now
    return [''];
  }
}
