import { ApiClient } from './client.js';
import { ApiResponse, LaneSlot } from '../types/api.js';

export class LanesApi {
  constructor(private client: ApiClient) {}

  async assignPlayer(paceGroup: string, position: number, playerId: number): Promise<ApiResponse<LaneSlot>> {
    try {
      const response = await this.client.getClient().put(
        `/lane/${paceGroup}/${position}/player`,
        { player_id: playerId }
      );
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Failed to assign player to lane'
      };
    }
  }

  async unassignPlayer(paceGroup: string, position: number): Promise<ApiResponse<LaneSlot>> {
    try {
      const response = await this.client.getClient().delete(
        `/lane/${paceGroup}/${position}/player`
      );
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Failed to unassign player from lane'
      };
    }
  }
}
