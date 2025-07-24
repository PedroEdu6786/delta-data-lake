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
import { GetTableCommand, GlueClient } from '@aws-sdk/client-glue';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import config from 'config';
import { QueryEngine } from '../../types/query-engine.interface';
import { unfoldTokens } from 'src/aws/unfold-tokens';
import { getErrorMessage, isError } from 'src/commons/helpers';

@Injectable()
export class AthenaQueryEngineService implements QueryEngine {
  private readonly athenaDatabase = config.get<string>('aws.athena.database');
  private readonly s3OutputLocation = config.get<string>(
    'aws.athena.s3OutputLocation',
  );
  private readonly awsRegion = config.get<string>('aws.region');
  private readonly awsProfile = config.get<string>('aws.profile');

  private athenaClient = new AthenaClient({
    region: this.awsRegion,
    credentials: fromIni({ profile: this.awsProfile }),
  });

  private glueClient = new GlueClient({
    region: this.awsRegion,
    credentials: fromIni({ profile: this.awsProfile }),
  });
  constructor() {
    // private readonly glueClient: GlueClient, // private readonly athenaClient: AthenaClient, // private readonly awsClientBuilder: AwsClientBuilder,
    // this.athenaClient = this.awsClientBuilder.build(AthenaClient);
    // this.glueClient = this.awsClientBuilder.build(GlueClient);
  }

  getTableNames(): string[] {
    throw new Error('Method not implemented.');
  }

  private async validateTableExists(
    database: string,
    tableName: string,
  ): Promise<void> {
    try {
      await this.glueClient.send(
        new GetTableCommand({
          DatabaseName: this.athenaDatabase,
          Name: tableName,
        }),
      );
    } catch (error: unknown) {
      if (isError(error)) {
        throw new NotFoundException(`Table "${tableName}" does not exist`);
      }
      throw new BadRequestException(
        `Error validating table: ${getErrorMessage(error)}`,
      );
    }
  }

  private removePaginationFromQuery(query: string): string {
    // Remove existing LIMIT and OFFSET clauses (case insensitive)
    return query
      .replace(/\s+LIMIT\s+\d+/gi, '')
      .replace(/\s+OFFSET\s+\d+/gi, '')
      .trim();
  }

  private addPaginationToQuery(
    query: string,
    page: number,
    limit: number,
  ): string {
    const cleanQuery = this.removePaginationFromQuery(query);
    const offset = (page - 1) * limit;

    // Wrap the original query with ROW_NUMBER() for pagination
    return `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as rn
        FROM (${cleanQuery}) t
      ) paginated
      WHERE rn > ${offset} AND rn <= ${offset + limit}
    `;
  }

  async runQuery(
    query: string,
    tableName: string,
    page: number,
    limit: number,
  ): Promise<any> {
    try {
      await this.validateTableExists(this.athenaDatabase, tableName);

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
        throw new Error('Failed to get query execution ID from Athena');
      }

      // Poll status
      let status = 'QUEUED';
      while (status === 'QUEUED' || status === 'RUNNING') {
        await new Promise((res) => setTimeout(res, 1000));
        const state = await this.athenaClient.send(
          new GetQueryExecutionCommand({
            QueryExecutionId: queryId,
          }),
        );
        status = state.QueryExecution?.Status?.State || 'FAILED';

        if (status === 'FAILED') {
          const reason = state.QueryExecution?.Status?.StateChangeReason;
          throw new Error(`Athena query failed: ${reason || 'Unknown error'}`);
        }
      }

      const results = await unfoldTokens(async (nextToken) => {
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

      const data = this.parseAthenaResults(results);

      return {
        data,
        pagination: {
          page,
          limit,
          total: data.length,
        },
      };
    } catch (error: unknown) {
      if (isError(error)) {
        throw new Error(`Query execution failed: ${error.message}`);
      }
      throw new Error(`Query execution failed: ${getErrorMessage(error)}`);
    }
  }

  private parseAthenaResults(results: Row[]): Record<string, string>[] {
    const rows = results;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].Data?.map((d) => d.VarCharValue ?? '');
    const dataRows = rows.slice(1);

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
