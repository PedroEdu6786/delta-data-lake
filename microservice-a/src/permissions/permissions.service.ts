import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import config from 'config';
import { GenericHttpClient } from 'src/commons/helpers/http.client';

interface PermissionCheckResponse {
  allowed: boolean;
  deniedTables: string[];
}

@Injectable()
export class PermissionsService {
  private readonly httpClient: GenericHttpClient;

  constructor(private readonly httpService: HttpService) {
    const baseUrl = config.get<string>('permissions.serviceUrl');
    const timeout = config.get<number>('permissions.timeout');

    this.httpClient = new GenericHttpClient(this.httpService, baseUrl, timeout);
  }

  async checkAccess(
    token: string,
    tables: string[],
  ): Promise<PermissionCheckResponse> {
    try {
      return this.httpClient.post<PermissionCheckResponse>(
        '/permissions/check',
        { tables },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {
      throw new HttpException(
        'Permission check failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
