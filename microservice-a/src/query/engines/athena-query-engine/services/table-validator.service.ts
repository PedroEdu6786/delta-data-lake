import { Injectable } from '@nestjs/common';
import { GlueClient, GetTableCommand } from '@aws-sdk/client-glue';
import { isError } from 'src/commons/helpers';

@Injectable()
export class TableValidatorService {
  constructor(private readonly glueClient: GlueClient) {}

  async validateTableExists(
    database: string,
    tableName: string,
  ): Promise<boolean> {
    try {
      await this.glueClient.send(
        new GetTableCommand({
          DatabaseName: database,
          Name: tableName,
        }),
      );

      return true;
    } catch (error: unknown) {
      if (isError(error)) {
        console.error(`Table "${tableName}" does not exist`);
      }

      return false;
    }
  }
}
