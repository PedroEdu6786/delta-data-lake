import { BadRequestException } from '@nestjs/common';
import { AstTableExtractor } from './ast-table-extractor';

describe('AstTableExtractor', () => {
  let extractor: AstTableExtractor;

  beforeEach(() => {
    extractor = new AstTableExtractor();
  });

  describe('extractTableNames', () => {
    it('should extract table names from valid SQL', () => {
      const result = extractor.extractTableNames('SELECT * FROM users, orders');

      expect(result).toEqual(['users', 'orders']);
    });

    it('should handle JOIN queries', () => {
      const result = extractor.extractTableNames(
        'SELECT o.id, u.name FROM orders o JOIN users u ON o.userId = u.id',
      );

      expect(result).toEqual(['orders', 'users']);
    });

    it('should handle subqueries', () => {
      const result = extractor.extractTableNames(
        'SELECT * FROM (SELECT * FROM nested_table) sub WHERE main_table.id = 1',
      );

      expect(result).toContain('nested_table');
    });

    it('should throw BadRequestException for invalid SQL', () => {
      expect(() => extractor.extractTableNames('INVALID SQL SYNTAX')).toThrow(
        BadRequestException,
      );
    });

    it('should handle complex queries with multiple tables', () => {
      const result = extractor.extractTableNames(
        'SELECT o.id, u.name, p.title FROM orders o JOIN users u ON o.userId = u.id JOIN products p ON p.id = oi.productId JOIN order_items oi ON oi.orderId = o.id',
      );

      expect(result).toEqual(
        expect.arrayContaining(['orders', 'users', 'products', 'order_items']),
      );
    });
  });
});
