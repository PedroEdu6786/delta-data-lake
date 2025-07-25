import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AthenaErrorHandlerService } from './athena-error-handler.service';

describe('AthenaErrorHandlerService', () => {
  let service: AthenaErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AthenaErrorHandlerService],
    }).compile();

    service = module.get<AthenaErrorHandlerService>(AthenaErrorHandlerService);
  });

  describe('handleAthenaError', () => {
    it('should throw BadRequestException for TYPE_MISMATCH errors', () => {
      const errorMessage = 'TYPE_MISMATCH: Cannot cast varchar to integer';

      expect(() => service.handleAthenaError(errorMessage)).toThrow(
        BadRequestException,
      );

      try {
        service.handleAthenaError(errorMessage);
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toEqual({
          message: 'Invalid SQL query',
          details: errorMessage,
          suggestion:
            'Check data types in your query. Ensure IN clause values match column types, or use explicit type casting.',
        });
      }
    });

    it('should throw BadRequestException for SYNTAX_ERROR errors', () => {
      const errorMessage = 'SYNTAX_ERROR: mismatched input at line 1';

      expect(() => service.handleAthenaError(errorMessage)).toThrow(
        BadRequestException,
      );

      try {
        service.handleAthenaError(errorMessage);
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toEqual({
          message: 'Invalid SQL query',
          details: errorMessage,
          suggestion:
            'Review your SQL syntax. Check for missing commas, parentheses, or keywords.',
        });
      }
    });

    it('should throw BadRequestException for PERMISSION_DENIED errors', () => {
      const errorMessage = 'Access denied to table users';

      expect(() => service.handleAthenaError(errorMessage)).toThrow(
        BadRequestException,
      );

      try {
        service.handleAthenaError(errorMessage);
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toEqual({
          message: 'Access denied',
          details: errorMessage,
        });
      }
    });

    it('should throw InternalServerErrorException for RESOURCE_ERROR errors', () => {
      const errorMessage = 'Query timeout exceeded limit';

      expect(() => service.handleAthenaError(errorMessage)).toThrow(
        InternalServerErrorException,
      );

      try {
        service.handleAthenaError(errorMessage);
      } catch (error) {
        expect((error as InternalServerErrorException).getResponse()).toEqual({
          message: 'Query execution failed due to resource constraints',
          details: errorMessage,
        });
      }
    });

    it('should throw InternalServerErrorException for UNKNOWN errors', () => {
      const errorMessage = 'Some unexpected error occurred';

      expect(() => service.handleAthenaError(errorMessage)).toThrow(
        InternalServerErrorException,
      );

      try {
        service.handleAthenaError(errorMessage);
      } catch (error) {
        expect((error as InternalServerErrorException).getResponse()).toEqual({
          message: 'Query execution failed',
          details: errorMessage,
        });
      }
    });
  });

  describe('categorizeError', () => {
    it('should categorize type mismatch errors correctly', () => {
      const result = service['categorizeError'](
        'TYPE_MISMATCH: Cannot convert',
      );

      expect(result).toEqual({
        type: 'TYPE_MISMATCH',
        message: 'TYPE_MISMATCH: Cannot convert',
        suggestion:
          'Check data types in your query. Ensure IN clause values match column types, or use explicit type casting.',
      });
    });

    it('should categorize syntax errors correctly', () => {
      const result = service['categorizeError']('SYNTAX_ERROR at line 5');

      expect(result).toEqual({
        type: 'SYNTAX_ERROR',
        message: 'SYNTAX_ERROR at line 5',
        suggestion:
          'Review your SQL syntax. Check for missing commas, parentheses, or keywords.',
      });
    });

    it('should categorize mismatched input as syntax error', () => {
      const result = service['categorizeError']('mismatched input SELECT');

      expect(result.type).toBe('SYNTAX_ERROR');
    });

    it('should categorize permission errors correctly', () => {
      const result = service['categorizeError']('permission denied for table');

      expect(result).toEqual({
        type: 'PERMISSION_DENIED',
        message: 'permission denied for table',
      });
    });

    it('should categorize resource errors correctly', () => {
      const result = service['categorizeError']('resource limit exceeded');

      expect(result).toEqual({
        type: 'RESOURCE_ERROR',
        message: 'resource limit exceeded',
      });
    });

    it('should categorize timeout as resource error', () => {
      const result = service['categorizeError']('Query timeout occurred');

      expect(result.type).toBe('RESOURCE_ERROR');
    });

    it('should categorize unknown errors correctly', () => {
      const result = service['categorizeError']('Some random error');

      expect(result).toEqual({
        type: 'UNKNOWN',
        message: 'Some random error',
      });
    });

    it('should handle case insensitive error messages', () => {
      const result = service['categorizeError']('ACCESS DENIED TO TABLE');

      expect(result.type).toBe('PERMISSION_DENIED');
    });
  });
});
