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
    const visited = new WeakSet<object>();

    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') {
        return;
      }

      const obj = node as Record<string, unknown>;

      // Prevent circular reference infinite loops
      if (visited.has(obj)) {
        return;
      }
      visited.add(obj);

      // Extract table name if present
      if ('table' in obj && typeof obj.table === 'string') {
        tables.add(obj.table);
      }

      // Traverse all properties except blocked ones
      this.traverseFilteredProperties(obj, walk);
    };

    if (Array.isArray(ast)) {
      ast.forEach(walk);
    } else {
      walk(ast);
    }

    return [...tables];
  }

  private traverseFilteredProperties(
    obj: Record<string, unknown>,
    walkFn: (node: unknown) => void,
  ): void {
    // Blocked keys are properties that are not traversed
    // They contain query aliases as table definitions
    const blockedKeys = ['columns', 'with', 'on'];

    for (const key of Object.keys(obj)) {
      // Skip traversing into blocked properties
      if (blockedKeys.includes(key)) {
        continue;
      }

      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach(walkFn);
      } else if (this.isObject(value)) {
        walkFn(value);
      }
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
