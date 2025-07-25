import { PythonSqlTranspiler } from './python-sql-transpiler';

describe('PythonSqlTranspiler', () => {
  let transpiler: PythonSqlTranspiler;

  beforeEach(() => {
    transpiler = new PythonSqlTranspiler();
  });

  describe('toTrino', () => {
    describe('MySQL to Trino transpilation', () => {
      it('should transpile MySQL LIMIT to Trino', async () => {
        const mysqlQuery = 'SELECT * FROM users LIMIT 10';
        const result = await transpiler.toTrino(mysqlQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('users');
        expect(result.result).toContain('LIMIT');
      });

      it('should transpile MySQL backtick identifiers', async () => {
        const mysqlQuery = 'SELECT `user_id`, `full_name` FROM `user_table`';
        const result = await transpiler.toTrino(mysqlQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('user_id');
        expect(result.result).toContain('full_name');
        expect(result.result).toContain('user_table');
      });

      it('should transpile MySQL DATE_FORMAT function', async () => {
        const mysqlQuery =
          "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') FROM orders";
        const result = await transpiler.toTrino(mysqlQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('orders');
      });

      it('should transpile MySQL CONCAT function', async () => {
        const mysqlQuery =
          "SELECT CONCAT(first_name, ' ', last_name) as full_name FROM users";
        const result = await transpiler.toTrino(mysqlQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('users');
      });
    });

    describe('PostgreSQL to Trino transpilation', () => {
      it('should transpile PostgreSQL query to Trino', async () => {
        const postgresQuery = 'SELECT id, name FROM products WHERE price > 100';
        const result = await transpiler.toTrino(postgresQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('products');
      });

      it('should transpile PostgreSQL ILIKE operator', async () => {
        const postgresQuery = "SELECT * FROM users WHERE name ILIKE '%john%'";
        const result = await transpiler.toTrino(postgresQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('users');
      });

      it('should transpile PostgreSQL EXTRACT function', async () => {
        const postgresQuery =
          'SELECT EXTRACT(YEAR FROM created_at) FROM orders';
        const result = await transpiler.toTrino(postgresQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('orders');
      });

      it('should transpile PostgreSQL array operations', async () => {
        const postgresQuery =
          "SELECT tags[1] FROM articles WHERE 'tech' = ANY(tags)";
        const result = await transpiler.toTrino(postgresQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('articles');
      });

      it('should transpile PostgreSQL OFFSET LIMIT syntax', async () => {
        const postgresQuery =
          'SELECT * FROM products ORDER BY price OFFSET 10 LIMIT 5';
        const result = await transpiler.toTrino(postgresQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('products');
      });
    });

    describe('SQL Server to Trino transpilation', () => {
      it('should handle SQL Server TOP clause', async () => {
        const tsqlQuery = 'SELECT TOP 5 * FROM orders';
        const result = await transpiler.toTrino(tsqlQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('orders');
      });

      it('should handle SQL Server square bracket identifiers', async () => {
        const tsqlQuery = 'SELECT [user id], [full name] FROM [user table]';
        const result = await transpiler.toTrino(tsqlQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
      });
    });

    describe('Common SQL patterns', () => {
      it('should handle JOIN queries', async () => {
        const joinQuery =
          'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id';
        const result = await transpiler.toTrino(joinQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('JOIN');
        expect(result.result).toContain('users');
        expect(result.result).toContain('orders');
      });

      it('should handle aggregate functions', async () => {
        const aggregateQuery =
          'SELECT COUNT(*), AVG(price) FROM products GROUP BY category';
        const result = await transpiler.toTrino(aggregateQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('COUNT');
        expect(result.result).toContain('AVG');
        expect(result.result).toContain('GROUP BY');
      });

      it('should handle subqueries', async () => {
        const subquery =
          'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)';
        const result = await transpiler.toTrino(subquery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('SELECT');
        expect(result.result).toContain('WHERE');
        expect(result.result).toContain('IN');
      });

      it('should handle complex WHERE conditions', async () => {
        const complexQuery =
          'SELECT * FROM users WHERE age BETWEEN 18 AND 65 AND status = "active"';
        const result = await transpiler.toTrino(complexQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('BETWEEN');
        expect(result.result).toContain('AND');
      });

      it('should handle CASE statements', async () => {
        const caseQuery =
          'SELECT name, CASE WHEN age < 18 THEN "minor" ELSE "adult" END as category FROM users';
        const result = await transpiler.toTrino(caseQuery);

        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
        expect(result.result).toContain('CASE');
        expect(result.result).toContain('WHEN');
      });
    });

    describe('Error handling', () => {
      it('should return error for invalid SQL', async () => {
        const invalidQuery = 'INVALID SQL SYNTAX HERE';
        const result = await transpiler.toTrino(invalidQuery);

        expect(result.result).toBeUndefined();
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Could not parse SQL');
      });

      it('should handle empty query', async () => {
        const emptyQuery = '';
        const result = await transpiler.toTrino(emptyQuery);

        expect(result.result).toBeDefined();
      });

      it('should handle malformed queries', async () => {
        const malformedQuery = 'SELECT FROM WHERE';
        const result = await transpiler.toTrino(malformedQuery);

        expect(result.result).toBeUndefined();
        expect(result.error).toBeDefined();
      });
    });
  });
});
