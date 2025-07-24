import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

export interface AthenaErrorInfo {
  type:
    | 'SYNTAX_ERROR'
    | 'TYPE_MISMATCH'
    | 'PERMISSION_DENIED'
    | 'RESOURCE_ERROR'
    | 'UNKNOWN';
  message: string;
  suggestion?: string;
}

@Injectable()
export class AthenaErrorHandlerService {
  handleAthenaError(errorMessage: string): never {
    const errorInfo = this.categorizeError(errorMessage);

    switch (errorInfo.type) {
      case 'SYNTAX_ERROR':
      case 'TYPE_MISMATCH':
        throw new BadRequestException({
          message: 'Invalid SQL query',
          details: errorInfo.message,
          suggestion: errorInfo.suggestion,
        });

      case 'PERMISSION_DENIED':
        throw new BadRequestException({
          message: 'Access denied',
          details: errorInfo.message,
        });

      case 'RESOURCE_ERROR':
        throw new InternalServerErrorException({
          message: 'Query execution failed due to resource constraints',
          details: errorInfo.message,
        });

      default:
        throw new InternalServerErrorException({
          message: 'Query execution failed',
          details: errorInfo.message,
        });
    }
  }

  private categorizeError(errorMessage: string): AthenaErrorInfo {
    const message = errorMessage.toLowerCase();

    if (message.includes('type_mismatch')) {
      return {
        type: 'TYPE_MISMATCH',
        message: errorMessage,
        suggestion:
          'Check data types in your query. Ensure IN clause values match column types, or use explicit type casting.',
      };
    }

    if (
      message.includes('syntax_error') ||
      message.includes('mismatched input')
    ) {
      return {
        type: 'SYNTAX_ERROR',
        message: errorMessage,
        suggestion:
          'Review your SQL syntax. Check for missing commas, parentheses, or keywords.',
      };
    }

    if (message.includes('access denied') || message.includes('permission')) {
      return {
        type: 'PERMISSION_DENIED',
        message: errorMessage,
      };
    }

    if (
      message.includes('resource') ||
      message.includes('timeout') ||
      message.includes('limit exceeded')
    ) {
      return {
        type: 'RESOURCE_ERROR',
        message: errorMessage,
      };
    }

    return {
      type: 'UNKNOWN',
      message: errorMessage,
    };
  }
}
