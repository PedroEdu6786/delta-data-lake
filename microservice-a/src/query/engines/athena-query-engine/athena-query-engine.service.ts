import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  Row,
  StartQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import {
  BadRequestException,
  Inject,
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
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.athenaClient = this.awsClientFactory.createAthenaClient();
  }

  getTableNames(): string[] {
    throw new Error('Method not implemented.');
  }

  async *runQuery(
    query: string,
    tableName: string,
  ): AsyncGenerator<Record<string, any>, void> {
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

      const results = this.getQueryResults(queryId);
      const { headers, dataRows } = await this.separateHeadersFromData(results);

      for await (const row of dataRows) {
        const rowObj = this.parseAthenaResult(row, headers);
        if (rowObj) {
          yield rowObj;
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.error('Athena query execution failed', {
        error: errorMessage,
      });

      if (errorMessage.includes('Athena query failed:')) {
        const athenaError = errorMessage.replace('Athena query failed: ', '');
        this.errorHandler.handleAthenaError(athenaError);
      }

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
      this.logger.error('Athena query execution failed', {
        error: 'Failed to get query execution ID from Athena',
      });
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

  private async *getQueryResults(queryId: string): AsyncGenerator<Row> {
    yield* unfoldTokens(async (nextToken) => {
      const data = await this.athenaClient.send(
        new GetQueryResultsCommand({
          QueryExecutionId: queryId,
          MaxResults: 5,
          ...(nextToken ? { NextToken: nextToken } : {}),
        }),
      );

      return {
        elements: data.ResultSet?.Rows ?? [],
        nextToken: data.NextToken,
      };
    });
  }

  private async separateHeadersFromData(
    results: AsyncGenerator<Row>,
  ): Promise<{ headers: string[]; dataRows: AsyncGenerator<Row> }> {
    const firstRow = await results.next();
    if (firstRow.done) {
      throw new Error('No data returned from Athena query');
    }

    const headers =
      firstRow.value?.Data?.map((d) => d.VarCharValue ?? '') || [];
    const dataRows = results;

    return { headers, dataRows };
  }

  private parseAthenaResult(
    row: Row,
    headers: string[],
  ): Record<string, any> | null {
    const values = row?.Data?.map((d) => d.VarCharValue ?? null);
    if (!values) return null;

    return headers.reduce(
      (acc, header, idx) => {
        acc[header] = values[idx];
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
