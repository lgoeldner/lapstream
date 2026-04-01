import fs from 'fs/promises';
import { DeviceProfile } from '../types/api.js';

const STORAGE_FILE = 'storage.json';

export interface StorageData {
  savedDevices: DeviceProfile[];
  adminToken?: string;
}

export async function loadStorage(): Promise<StorageData> {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { savedDevices: [] };
  }
}

export async function saveStorage(data: StorageData): Promise<void> {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
}

export async function addDevice(device: DeviceProfile): Promise<void> {
  const data = await loadStorage();
  const existing = data.savedDevices.findIndex(d => d.deviceName === device.deviceName && d.role === device.role);
  
  if (existing >= 0) {
    data.savedDevices[existing] = device;
  } else {
    data.savedDevices.push(device);
  }
  
  await saveStorage(data);
}

// Keeping these for backward compatibility where needed
export async function loadDevices(): Promise<DeviceProfile[]> {
  const data = await loadStorage();
  return data.savedDevices;
}

export async function saveDevices(devices: DeviceProfile[]): Promise<void> {
  const data = await loadStorage();
  data.savedDevices = devices;
  await saveStorage(data);
}
