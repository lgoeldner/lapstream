import { ApiClient } from './client.js';
import { ApiResponse, Player } from '../types/api.js';

export class PlayersApi {
  constructor(private client: ApiClient) {}

  async getAll(): Promise<ApiResponse<Player[]>> {
    try {
      const response = await this.client.getClient().get('/player');
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Failed to fetch players'
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.getClient().get(`/player/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Failed to fetch player'
      };
    }
  }

  async create(name: string, age: number): Promise<ApiResponse<Player>> {
    try {
      const response = await this.client.getClient().post('/player', { name, age });
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Failed to create player'
      };
    }
  }

  async removeFromLane(playerId: number): Promise<ApiResponse<{ id: number; pace_group: string; slot_index: number; assigned_player: number | null }>> {
    try {
      const response = await this.client.getClient().delete(`/player/lane/${playerId}`);
      return response.data;
    } catch (error: any) {
      return {
        status: 'failure',
        err: error.response?.data?.err || error.message || 'Failed to remove player from lane'
      };
    }
  }
}
