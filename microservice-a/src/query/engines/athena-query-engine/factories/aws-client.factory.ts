import { Injectable } from '@nestjs/common';
import { AthenaClient } from '@aws-sdk/client-athena';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { GlueClient } from '@aws-sdk/client-glue';
import config from 'config';

@Injectable()
export class AwsClientFactory {
  createAthenaClient(): AthenaClient {
    return new AthenaClient({
      region: config.get<string>('aws.region'),
      credentials: fromIni({ profile: config.get<string>('aws.profile') }),
    });
  }

  createGlueClient(): GlueClient {
    return new GlueClient({
      region: config.get<string>('aws.region'),
      credentials: fromIni({ profile: config.get<string>('aws.profile') }),
    });
  }
}
