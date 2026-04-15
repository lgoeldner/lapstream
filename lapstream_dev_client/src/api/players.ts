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
}
