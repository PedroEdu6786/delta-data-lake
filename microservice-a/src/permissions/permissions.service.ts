import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

interface PermissionCheckResponse {
  allowed: boolean;
  deniedTables: string[];
}

@Injectable()
export class PermissionsService {
  constructor(private readonly httpService: HttpService) {}

  async checkAccess(
    userId: string,
    tables: string[],
  ): Promise<PermissionCheckResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<PermissionCheckResponse>(
          'http://localhost:3001/permissions/check',
          { userId, tables },
          {
            headers: {
              Authorization: `Bearer ${this.getUserToken(userId)}`,
              'Content-Type': 'application/json',
            },
          },
        ) as Observable<AxiosResponse<PermissionCheckResponse>>,
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

  private getUserToken(userId: string): string {
    // Implement logic to get/generate JWT token for the user
    // This might involve calling your auth service or using a service account token
    throw new Error('getUserToken not implemented');
  }
}
