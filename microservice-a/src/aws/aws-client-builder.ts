import { fromIni } from '@aws-sdk/credential-provider-ini';
import { Client } from '@smithy/smithy-client';

interface AwsClientBuilderOptions {
  region?: string;
}

export type AwsClientClass = typeof Client<any, any, any, any>;

const PROFILE = 'personal';
export class AwsClientBuilder {
  private readonly region: string;

  private clientInstanceMap: Map<string, InstanceType<AwsClientClass>> =
    new Map();

  constructor(options: AwsClientBuilderOptions = {}) {
    this.region = options.region ?? process.env.AWS_REGION ?? 'us-east-1';
  }

  build<T extends AwsClientClass>(client: T) {
    const clientName = client.name;
    const clientInstanceKey = `${clientName}-${this.region}`;

    const clientInstance = this.clientInstanceMap.get(clientInstanceKey);

    if (clientInstance) {
      return clientInstance;
    }

    const config = {
      region: this.region,
      credentials: fromIni({ profile: PROFILE }),
    };

    return new client(config);
  }
}
