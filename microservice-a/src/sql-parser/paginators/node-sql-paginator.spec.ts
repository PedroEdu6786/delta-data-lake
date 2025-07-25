import { NodeSqlPaginator } from './node-sql-paginator';

describe('NodeSqlPaginator', () => {
  let paginator: NodeSqlPaginator;

  beforeEach(() => {
    paginator = new NodeSqlPaginator();
  });

  describe('addPaginationToSql', () => {
    it('should add pagination to a simple SELECT query', () => {
      const query = 'SELECT * FROM users';
      const result = paginator.addPaginationToSql(query, 1, 10);

      expect(result).toContain('ROW_NUMBER() OVER (ORDER BY (SELECT NULL))');
      expect(result).toContain('WHERE row_num >= 1 AND row_num <= 10');
      expect(result).toContain('SELECT * FROM users');
    });

    it('should handle page 2 with correct offset calculation', () => {
      const query = 'SELECT * FROM products';
      const result = paginator.addPaginationToSql(query, 2, 5);

      expect(result).toContain('WHERE row_num >= 6 AND row_num <= 10');
    });

    it('should remove existing LIMIT clause before adding pagination', () => {
      const query = 'SELECT * FROM users LIMIT 100';
      const result = paginator.addPaginationToSql(query, 1, 10);

      expect(result).not.toContain('LIMIT 100');
      expect(result).toContain('WHERE row_num >= 1 AND row_num <= 10');
    });

    it('should remove existing OFFSET clause before adding pagination', () => {
      const query = 'SELECT * FROM users OFFSET 50';
      const result = paginator.addPaginationToSql(query, 1, 10);

      expect(result).not.toContain('OFFSET 50');
      expect(result).toContain('WHERE row_num >= 1 AND row_num <= 10');
    });

    it('should remove both LIMIT and OFFSET clauses', () => {
      const query = 'SELECT * FROM users LIMIT 20 OFFSET 10';
      const result = paginator.addPaginationToSql(query, 1, 5);

      expect(result).not.toContain('LIMIT 20');
      expect(result).not.toContain('OFFSET 10');
      expect(result).toContain('WHERE row_num >= 1 AND row_num <= 5');
    });

    it('should handle case insensitive LIMIT and OFFSET', () => {
      const query = 'SELECT * FROM users limit 20 offset 10';
      const result = paginator.addPaginationToSql(query, 1, 5);

      expect(result).not.toContain('limit 20');
      expect(result).not.toContain('offset 10');
    });

    it('should remove trailing semicolon from query', () => {
      const query = 'SELECT * FROM users;';
      const result = paginator.addPaginationToSql(query, 1, 10);

      expect(result).toContain('SELECT * FROM users');
      expect(result).toMatch(/;\s*$/);
    });

    it('should handle complex queries with WHERE clauses', () => {
      const query = 'SELECT id, name FROM users WHERE active = true';
      const result = paginator.addPaginationToSql(query, 3, 15);

      expect(result).toContain('WHERE active = true');
      expect(result).toContain('WHERE row_num >= 31 AND row_num <= 45');
    });

    it('should handle queries with ORDER BY clauses', () => {
      const query = 'SELECT * FROM users ORDER BY created_at DESC';
      const result = paginator.addPaginationToSql(query, 1, 10);

      expect(result).toContain('ORDER BY created_at DESC');
      expect(result).toContain('ROW_NUMBER() OVER (ORDER BY (SELECT NULL))');
    });

    it('should handle edge case with page 1 and limit 1', () => {
      const query = 'SELECT * FROM users';
      const result = paginator.addPaginationToSql(query, 1, 1);

      expect(result).toContain('WHERE row_num >= 1 AND row_num <= 1');
    });

    it('should handle large page numbers', () => {
      const query = 'SELECT * FROM users';
      const result = paginator.addPaginationToSql(query, 100, 25);

      expect(result).toContain('WHERE row_num >= 2476 AND row_num <= 2500');
    });
  });
});
