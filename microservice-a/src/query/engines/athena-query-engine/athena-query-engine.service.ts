import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  Row,
  StartQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryEngine } from '../../types/query-engine.interface';
import { unfoldTokens } from 'src/aws/unfold-tokens';
import { getErrorMessage } from 'src/commons/helpers';
import { AwsClientFactory } from './factories/aws-client.factory';
import { TableValidatorService } from './services/table-validator.service';
import config from 'config';
import { AthenaErrorHandlerService } from './services/athena-error-handler.service';

@Injectable()
export class AthenaQueryEngineService implements QueryEngine {
  private readonly athenaDatabase = config.get<string>('aws.athena.database');
  private readonly s3OutputLocation = config.get<string>(
    'aws.athena.s3OutputLocation',
  );
  private readonly athenaClient: AthenaClient;

  constructor(
    private readonly awsClientFactory: AwsClientFactory,
    private readonly tableValidator: TableValidatorService,
    private readonly errorHandler: AthenaErrorHandlerService,
  ) {
    this.athenaClient = this.awsClientFactory.createAthenaClient();
  }

  getTableNames(): string[] {
    throw new Error('Method not implemented.');
  }

  async runQuery(query: string, tableName: string): Promise<any> {
    try {
      const tableExists = await this.tableValidator.validateTableExists(
        this.athenaDatabase,
        tableName,
      );

      if (!tableExists) {
        throw new NotFoundException(`Table "${tableName}" does not exist`);
      }

      const queryId = await this.executeQuery(query);
      await this.waitForQueryCompletion(queryId);

      const results = await this.getQueryResults(queryId);
      const data = this.parseAthenaResults(results);

      return {
        data,
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);

      // Check if it's an Athena-specific error
      if (errorMessage.includes('Athena query failed:')) {
        const athenaError = errorMessage.replace('Athena query failed: ', '');
        this.errorHandler.handleAthenaError(athenaError);
      }

      // Re-throw other errors as-is
      throw error;
    }
  }

  private async executeQuery(query: string): Promise<string> {
    const start = await this.athenaClient.send(
      new StartQueryExecutionCommand({
        QueryString: query,
        QueryExecutionContext: { Database: this.athenaDatabase },
        ResultConfiguration: {
          OutputLocation: this.s3OutputLocation,
        },
      }),
    );

    const queryId = start.QueryExecutionId;
    if (!queryId) {
      throw new BadRequestException(
        'Failed to get query execution ID from Athena',
      );
    }
    return queryId;
  }

  private async waitForQueryCompletion(queryId: string): Promise<void> {
    let status = 'QUEUED';
    while (status === 'QUEUED' || status === 'RUNNING') {
      await new Promise((res) => setTimeout(res, 1000));
      const state = await this.athenaClient.send(
        new GetQueryExecutionCommand({ QueryExecutionId: queryId }),
      );
      status = state.QueryExecution?.Status?.State || 'FAILED';

      if (status === 'FAILED') {
        const reason = state.QueryExecution?.Status?.StateChangeReason;
        throw new Error(`Athena query failed: ${reason || 'Unknown error'}`);
      }
    }
  }

  private async getQueryResults(queryId: string): Promise<Row[]> {
    return await unfoldTokens(async (nextToken) => {
      const data = await this.athenaClient.send(
        new GetQueryResultsCommand({
          QueryExecutionId: queryId,
          MaxResults: 100,
          ...(nextToken ? { NextToken: nextToken } : {}),
        }),
      );

      return {
        elements: data.ResultSet?.Rows ?? [],
        nextToken: data.NextToken,
      };
    });
  }

  private parseAthenaResults(results: Row[]): Record<string, string>[] {
    if (!results || results.length < 2) return [];

    const headers = results[0].Data?.map((d) => d.VarCharValue ?? '');
    const dataRows = results.slice(1);

    if (!headers) return [];

    return dataRows.map((row) => {
      const values = row.Data?.map((d) => d.VarCharValue ?? '');
      if (!values) return {};
      return headers.reduce(
        (acc, header, idx) => {
          acc[header] = values[idx];
          return acc;
        },
        {} as Record<string, string>,
      );
    });
  }
}
