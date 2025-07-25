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
  });
});
