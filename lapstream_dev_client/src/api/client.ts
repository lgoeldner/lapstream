import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import chalk from 'chalk';
import { DeviceCredentials, AppState } from '../types/api.js';
import { saveDevices } from '../config/storage.js';

export class ApiClient {
  private client: AxiosInstance;
  private state?: AppState;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor(baseURL: string, state?: AppState) {
    this.state = state;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const credentials = this.state?.activeDevice?.credentials;
        if (credentials && config.headers && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${credentials.jwt}`;
        }
        return config;
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        const isAuthError = error.response?.status === 401 || error.response?.status === 403;

        if (isAuthError && !originalRequest._retry) {
          console.log(chalk.gray(`[DEBUG] Auth error detected (status: ${error.response?.status}) for ${error.config?.url}`));

          if (this.isRefreshing) {
            console.log(chalk.gray(`[DEBUG] Already refreshing, queuing request...`));
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = this.state?.activeDevice?.credentials?.refresh_token;

          if (!refreshToken) {
            console.log(chalk.red('[DEBUG] No refresh token found in active device credentials'));
            this.isRefreshing = false;
            return Promise.reject(error);
          }

          try {
            console.log(chalk.blue('[Auth] Token expired, attempting refresh...'));
            const refreshResponse = await axios.post(`${this.client.defaults.baseURL}/auth/refresh`, {
              refresh_token: refreshToken
            });

            if (refreshResponse.data.status === 'ok' && refreshResponse.data.data) {
              console.log(chalk.green('[Auth] Token refreshed successfully'));
              const newCredentials = refreshResponse.data.data;
              
              if (this.state?.activeDevice) {
                this.state.activeDevice.credentials = newCredentials;
                
                // Update in savedDevices as well
                const idx = this.state.savedDevices.findIndex(d => 
                  d.deviceName === this.state?.activeDevice?.deviceName && 
                  d.role === this.state?.activeDevice?.role
                );
                if (idx !== -1) {
                  this.state.savedDevices[idx].credentials = newCredentials;
                }
                
                await saveDevices(this.state.savedDevices);
              }

              this.processQueue(null, newCredentials.jwt);
              
              console.log(chalk.gray(`[DEBUG] Retrying original request with new token...`));
              originalRequest.headers.Authorization = `Bearer ${newCredentials.jwt}`;
              console.log(chalk.gray(`[DEBUG] Header set to: ${originalRequest.headers.Authorization.substring(0, 30)}...`));
              // For axios 1.x, we should also update the headers object properly if it uses a Headers object
              if (originalRequest.headers.set) {
                originalRequest.headers.set('Authorization', `Bearer ${newCredentials.jwt}`);
              }
              
              return this.client(originalRequest);
            } else {
              console.log(chalk.red(`[Auth] Refresh response NOT OK: ${JSON.stringify(refreshResponse.data)}`));
              throw new Error('Refresh failed');
            }
          } catch (refreshError: any) {
            const errMsg = refreshError.response?.data?.err || refreshError.message;
            console.log(chalk.red(`[Auth] Refresh failed: ${errMsg}`));
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  setState(state: AppState): void {
    this.state = state;
  }

  setCredentials(credentials: DeviceCredentials): void {
    if (this.state?.activeDevice) {
      this.state.activeDevice.credentials = credentials;
    }
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  async healthCheck(): Promise<{ service: string; ok: boolean }> {
    try {
      const response = await this.client.get('/');
      return response.data;
    } catch (error) {
      return { service: 'api', ok: false };
    }
  }

  async healthDb(): Promise<{ status: string; db: string }> {
    const response = await this.client.get('/health/db');
    return response.data;
  }
}
