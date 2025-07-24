import { AST, Parser } from 'node-sql-parser';
import { TableExtractor } from '../interfaces/table-extractor.interface';

export class AstTableExtractor implements TableExtractor {
  private readonly dialects = ['postgresql', 'mysql'];

  extractTableNames(sql: string): string[] {
    const parser = new Parser();
    let ast: AST | AST[] | null = null;
    let lastError: unknown;

    for (const dialect of this.dialects) {
      try {
        ast = parser.astify(sql, { database: dialect });
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!ast || lastError) {
      throw new Error(`Failed to parse SQL for all dialects`);
    }

    return this.extractTablesFromAst(ast);
  }

  private extractTablesFromAst(ast: AST | AST[]): string[] {
    const tables = new Set<string>();

    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;

      if ('table' in node && typeof node.table === 'string') {
        tables.add(node.table);
      }

      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          const value: unknown = node[key];

          if (Array.isArray(value)) {
            value.forEach(walk);
          } else if (typeof value === 'object' && value !== null) {
            walk(value);
          }
        }
      }
    };

    if (Array.isArray(ast)) {
      ast.forEach(walk);
    } else {
      walk(ast);
    }

    return [...tables];
  }
}
