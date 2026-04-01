export interface ApiResponse<T> {
  status: 'ok' | 'failure';
  data?: T;
  err?: string;
  error?: unknown;
}

export interface DeviceCredentials {
  jwt: string;
  refresh_token: string;
}

export interface EnrollResponse {
  id: number;
  deviceName: string;
  role: Role;
  registeredAt: string;
  credentials: DeviceCredentials;
}

export interface Player {
  id: number;
  name: string;
  age: number;
}

export interface LaneSlot {
  id: number;
  pace_group: string;
  slot_index: number;
  assigned_player: number | null;
}

export interface OtpClaim {
  role: Role;
  name: string;
}

export interface GeneratedOtp {
  role: Role;
  deviceName: string;
  otp: string;
  expiresAt: string;
}

export type Role = 'admin' | 'reception' | 'lane_assign' | 'lane_count';

export interface DeviceProfile {
  deviceName: string;
  role: Role;
  credentials: DeviceCredentials;
}

export interface AppState {
  apiBaseUrl: string;
  activeDevice?: DeviceProfile;
  savedDevices: DeviceProfile[];
  adminToken?: string;
}
