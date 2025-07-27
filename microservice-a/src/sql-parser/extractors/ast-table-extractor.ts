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
    const MAX_DEPTH = 50; // AVOID CIRCULAR REFERENCE

    const walk = (node: unknown, depth = 0): void => {
      if (depth > MAX_DEPTH || this.shouldSkipNode(node)) {
        return;
      }

      const obj = node as Record<string, unknown>;

      if ('table' in obj && typeof obj.table === 'string') {
        tables.add(obj.table);
      }

      this.traverseNestedPropertiesWithDepth(obj, walk, depth + 1);
    };

    if (Array.isArray(ast)) {
      ast.forEach(walk);
    } else {
      walk(ast);
    }

    return [...tables];
  }

  private shouldSkipNode(node: unknown): boolean {
    if (!node || typeof node !== 'object') {
      return true;
    }

    // Skip column references and WITH clauses as they cause conflicts with table names
    const obj = node as Record<string, unknown>;
    return 'column' in obj || 'with' in obj;
  }

  private traverseNestedPropertiesWithDepth(
    obj: Record<string, unknown>,
    walkFn: (node: unknown, depth: number) => void,
    depth: number,
  ): void {
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (Array.isArray(value)) {
        // Process each item in arrays (e.g., FROM clauses, JOIN clauses)
        value.forEach((item) => walkFn(item, depth));
      } else if (this.isObject(value)) {
        // Process nested objects (e.g., subqueries, WHERE conditions)
        walkFn(value, depth);
      }
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
