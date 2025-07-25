import { AST, Parser } from 'node-sql-parser';
import { TableExtractor } from '../interfaces/table-extractor.interface';
import { BadRequestException } from '@nestjs/common';
import { getErrorMessage } from '../../commons/helpers';

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
      if (
        !node ||
        typeof node !== 'object' ||
        'column' in node ||
        'with' in node
      )
        return;

      const obj = node as Record<string, unknown>;

      // Handle nodes with a table and optional alias
      if ('table' in obj && typeof obj.table === 'string') {
        // This ensures we only add actual table names, not aliases
        tables.add(obj.table);
      }

      // Dive deeper into nested structures
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
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
