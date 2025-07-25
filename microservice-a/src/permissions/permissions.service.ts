import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import config from 'config';
import { GenericHttpClient } from 'src/commons/helpers/http.client';
import { getErrorMessage } from 'src/commons/helpers';

interface PermissionCheckResponse {
  allowed: boolean;
  deniedTables: string[];
}

@Injectable()
export class PermissionsService {
  private readonly httpClient: GenericHttpClient;

  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const baseUrl = config.get<string>('permissions.serviceUrl');
    const timeout = config.get<number>('permissions.timeout');

    this.httpClient = new GenericHttpClient(this.httpService, baseUrl, timeout);
  }

  async checkAccess(
    token: string,
    tables: string[],
  ): Promise<PermissionCheckResponse> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/permissions/check',
        { tables },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response;
    } catch (error) {
      this.logger.error('Could not check permissions', {
        error: getErrorMessage(error),
      });
      throw new HttpException(
        'Could not check permissions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
