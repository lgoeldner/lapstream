export interface AppConfig {
  apiBaseUrl: string;
}

export function getConfig(): AppConfig {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  return {
    apiBaseUrl
  };
}
