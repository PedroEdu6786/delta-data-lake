import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  Row,
  StartQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import { Injectable } from '@nestjs/common';
import { QueryEngine } from 'src/query/types/query-engine.interface';
import { GetTableCommand, GlueClient } from '@aws-sdk/client-glue';
import { getErrorMessage, isError } from 'src/commons/helpers';
// import { AwsClientBuilder } from 'src/aws/aws-client-builder';
import { unfoldTokens } from 'src/aws/unfold-tokens';
import { fromIni } from '@aws-sdk/credential-provider-ini';

const database = 'arkham_query';

@Injectable()
export class AthenaQueryEngineService implements QueryEngine {
  private athenaClient = new AthenaClient({
    region: 'us-east-1',
    credentials: fromIni({ profile: 'personal' }),
  });

  private glueClient = new GlueClient({
    region: 'us-east-1',
    credentials: fromIni({ profile: 'personal' }),
  });
  constructor() {
    // private readonly glueClient: GlueClient, // private readonly athenaClient: AthenaClient, // private readonly awsClientBuilder: AwsClientBuilder,
    // this.athenaClient = this.awsClientBuilder.build(AthenaClient);
    // this.glueClient = this.awsClientBuilder.build(GlueClient);
  }

  getTableNames(): string[] {
    throw new Error('Method not implemented.');
  }

  async validateTableExists(
    database: string,
    tableName: string,
  ): Promise<void> {
    try {
      await this.glueClient.send(
        new GetTableCommand({
          DatabaseName: database,
          Name: tableName,
        }),
      );
    } catch (error: unknown) {
      if (isError(error)) {
        throw new Error(
          `Table "${tableName}" does not exist in database "${database}".`,
        );
      }
      throw new Error(`Error validating table: ${getErrorMessage(error)}`);
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

  async runQuery(query: string, page: number, limit: number): Promise<any> {
    try {
      const match = query.match(/from\s+(?:\w+\.)?(\w+)/i);
      const tableName = match?.[1];

      if (!tableName) {
        throw new Error('Could not determine table name from query.');
      }

      await this.validateTableExists(database, tableName);

      // const paginatedQuery = this.addPaginationToQuery(
      //   decodeURIComponent(query),
      //   page,
      //   limit,
      // );

      const start = await this.athenaClient.send(
        new StartQueryExecutionCommand({
          QueryString: query,
          QueryExecutionContext: { Database: 'arkham_query' },
          ResultConfiguration: {
            OutputLocation: 's3://pedro-arkham-athena-query/results/',
          },
        }),
      );

      const queryId = start.QueryExecutionId;

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
          throw new Error('Athena query failed');
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
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async fetchQueryResultsPaginated(
    queryExecutionId: string,
    nextToken?: string,
  ) {
    const result = await this.athenaClient.send(
      new GetQueryResultsCommand({
        QueryExecutionId: queryExecutionId,
        MaxResults: 1, // Optional: use to limit per page size
        ...(nextToken ? { NextToken: nextToken } : {}),
      }),
    );

    const rows = result.ResultSet?.Rows ?? [];
    const headers = rows[0].Data?.map((d) => d.VarCharValue);
    const dataRows = rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      row.Data?.forEach((cell, index) => {
        if (headers && headers[index]) {
          obj[headers[index]] = cell.VarCharValue || '';
        }
      });
      return obj;
    });

    return {
      data: dataRows,
      nextToken: result.NextToken,
    };
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
