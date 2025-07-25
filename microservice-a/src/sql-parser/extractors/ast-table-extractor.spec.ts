/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { AstTableExtractor } from './ast-table-extractor';
import { AST, Parser } from 'node-sql-parser';

jest.mock('node-sql-parser');

describe('AstTableExtractor', () => {
  let extractor: AstTableExtractor;
  let mockParser: jest.Mocked<Parser>;

  beforeEach(() => {
    mockParser = {
      astify: jest.fn(),
    } as unknown as jest.Mocked<Parser>;

    (Parser as jest.MockedClass<typeof Parser>).mockImplementation(
      () => mockParser,
    );
    extractor = new AstTableExtractor();
  });

  describe('extractTableNames', () => {
    it('should extract table names from valid SQL', () => {
      const mockAst = {
        type: 'select',
        from: [{ table: 'users' }, { table: 'orders' }],
      } as AST;
      mockParser.astify.mockReturnValueOnce(mockAst);

      const result = extractor.extractTableNames('SELECT * FROM users, orders');

      expect(result).toEqual(['users', 'orders']);
      expect(mockParser.astify).toHaveBeenCalledWith(
        'SELECT * FROM users, orders',
        { database: 'postgresql' },
      );
    });

    it('should try multiple dialects and succeed with second one', () => {
      mockParser.astify
        .mockImplementationOnce(() => {
          throw new Error('PostgreSQL parse error');
        })
        .mockReturnValueOnce({
          type: 'select',
          from: [{ table: 'products' }],
        } as AST);

      const result = extractor.extractTableNames('SELECT * FROM products');

      expect(result).toEqual(['products']);
      expect(mockParser.astify).toHaveBeenCalledTimes(2);
      expect(mockParser.astify).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM products',
        { database: 'postgresql' },
      );
      expect(mockParser.astify).toHaveBeenNthCalledWith(
        2,
        'SELECT * FROM products',
        { database: 'mysql' },
      );
    });

    it('should throw BadRequestException when all dialects fail', () => {
      const parseError = new Error('Invalid SQL syntax');
      mockParser.astify.mockImplementation(() => {
        throw parseError;
      });

      expect(() => extractor.extractTableNames('INVALID SQL')).toThrow(
        BadRequestException,
      );

      try {
        extractor.extractTableNames('INVALID SQL');
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toEqual({
          message: 'Invalid SQL query',
          details: 'Invalid SQL syntax',
          suggestion:
            'Review your SQL syntax. Check for missing commas, parentheses, or keywords.',
        });
      }
    });

    it('should handle array of AST nodes', () => {
      const mockAstArray = [
        { type: 'select', from: [{ table: 'table1' }] },
        { type: 'select', from: [{ table: 'table2' }] },
      ];
      mockParser.astify.mockReturnValue(mockAstArray as AST[]);

      const result = extractor.extractTableNames(
        'SELECT * FROM table1; SELECT * FROM table2',
      );

      expect(result).toEqual(['table1', 'table2']);
    });

    it('should handle nested objects in AST', () => {
      const mockAst = {
        type: 'select',
        from: [
          {
            type: 'subquery',
            subquery: {
              from: [{ table: 'nested_table' }],
            },
          },
        ],
        where: {
          left: { table: 'main_table' },
        },
      } as unknown as AST;
      mockParser.astify.mockReturnValue(mockAst);

      const result = extractor.extractTableNames(
        'SELECT * FROM (SELECT * FROM nested_table) WHERE main_table.id = 1',
      );

      expect(result).toEqual(['nested_table', 'main_table']);
    });

    it('should extract table names from queries with aliases', () => {
      const mockAst = {
        type: 'select',
        from: [{ table: 'orders', as: 'o' }],
        join: [{ table: 'users', as: 'u', on: {} }],
      } as unknown as AST;
      mockParser.astify.mockReturnValue(mockAst);

      const result = extractor.extractTableNames(
        'SELECT o.id, o.total, u.name FROM orders o JOIN users u ON o.userId = u.id',
      );

      expect(result).toEqual(['orders', 'users']);
    });

    it('should handle multiple table aliases in FROM clause', () => {
      const mockAst = {
        type: 'select',
        from: [
          { table: 'products', as: 'p' },
          { table: 'categories', as: 'c' },
        ],
      } as unknown as AST;
      mockParser.astify.mockReturnValue(mockAst);

      const result = extractor.extractTableNames(
        'SELECT p.name, c.title FROM products p, categories c',
      );

      expect(result).toEqual(['products', 'categories']);
    });

    it('should extract tables from complex JOIN queries with aliases', () => {
      const mockAst = {
        type: 'select',
        from: [{ table: 'orders', as: 'o' }],
        join: [
          { table: 'users', as: 'u', on: {} },
          { table: 'products', as: 'p', on: {} },
          { table: 'order_items', as: 'oi', on: {} },
        ],
      } as unknown as AST;
      mockParser.astify.mockReturnValue(mockAst);

      const result = extractor.extractTableNames(
        'SELECT o.id, u.name, p.title FROM orders o JOIN users u ON o.userId = u.id JOIN products p ON p.id = oi.productId JOIN order_items oi ON oi.orderId = o.id',
      );

      expect(result).toEqual(['orders', 'users', 'products', 'order_items']);
    });

    it('should handle subqueries with aliases', () => {
      const mockAst = {
        type: 'select',
        from: [
          {
            type: 'subquery',
            as: 'sub',
            subquery: {
              from: [{ table: 'user_stats', as: 'us' }],
            },
          },
        ],
        join: [{ table: 'users', as: 'u', on: {} }],
      } as unknown as AST;
      mockParser.astify.mockReturnValue(mockAst);

      const result = extractor.extractTableNames(
        'SELECT u.name, sub.total FROM (SELECT userId, SUM(amount) as total FROM user_stats us GROUP BY userId) sub JOIN users u ON u.id = sub.userId',
      );

      expect(result).toEqual(['user_stats', 'users']);
    });
  });
});
