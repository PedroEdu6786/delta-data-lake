import { AST, Parser } from 'node-sql-parser';
import { TableExtractor } from '../interfaces/table-extractor.interface';
import { BadRequestException } from '@nestjs/common';
import { getErrorMessage } from 'src/commons/helpers';

export class AstTableExtractor implements TableExtractor {
  private readonly dialects = ['postgresql', 'mysql'];

  extractTableNames(sql: string): string[] {
    const parser = new Parser();
    let ast: AST | AST[] | null = null;
    let lastError: unknown;

    // Test out multiple dialects until it founds the appropriate one
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
      throw new BadRequestException({
        message: 'Invalid SQL query',
        details: getErrorMessage(lastError),
        suggestion:
          'Review your SQL syntax. Check for missing commas, parentheses, or keywords.',
      });
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
