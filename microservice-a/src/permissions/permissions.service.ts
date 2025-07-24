import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface PermissionCheckResponse {
  allowed: boolean;
  deniedTables: string[];
}

@Injectable()
export class PermissionsService {
  constructor(private readonly httpService: HttpService) {}

  async checkAccess(
    token: string,
    tables: string[],
  ): Promise<PermissionCheckResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<PermissionCheckResponse>(
          'http://localhost:3001/permissions/check',
          { tables },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Failed to check permissions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
