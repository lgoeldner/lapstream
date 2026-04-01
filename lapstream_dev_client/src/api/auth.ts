import { ApiClient } from './client.js';
import { ApiResponse, EnrollResponse, GeneratedOtp, OtpClaim } from '../types/api.js';

export class AuthApi {
  constructor(private client: ApiClient) {}

  async enrollDevice(otp: string): Promise<ApiResponse<EnrollResponse>> {
    try {
      const response = await this.client.getClient().post('/auth/device', { otp });
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Unknown error'
      };
    }
  }

  async generateOTPs(adminToken: string, claims: OtpClaim[]): Promise<ApiResponse<GeneratedOtp[]>> {
    try {
      const response = await this.client.getClient().post('/auth/admin/otp', claims, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      return {
        status: 'ok',
        data: response.data
      };
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Unknown error'
      };
    }
  }
}
