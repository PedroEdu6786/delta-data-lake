import { Injectable } from '@nestjs/common';
import { AthenaClient } from '@aws-sdk/client-athena';
import { GlueClient } from '@aws-sdk/client-glue';
import config from 'config';
import { fromIni } from '@aws-sdk/credential-provider-ini';

@Injectable()
export class AwsClientFactory {
  private getAwsConfig() {
    const region = config.get<string>('aws.region');
    const profile = config.get<string>('aws.profile');

    return {
      region,
      ...(profile && { credentials: fromIni({ profile }) }),
    };
  }

  createAthenaClient(): AthenaClient {
    return new AthenaClient(this.getAwsConfig());
  }

  createGlueClient(): GlueClient {
    return new GlueClient(this.getAwsConfig());
  }
}
