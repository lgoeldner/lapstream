import inquirer from 'inquirer';
import { AppState } from '../types/api.js';
import { loadStorage, saveStorage } from '../config/storage.js';

export async function promptForAdminToken(state: AppState): Promise<string | null> {
  // Check if we already have it
  if (state.adminToken) {
    return state.adminToken;
  }

  try {
    const { adminToken } = await inquirer.prompt([
      {
        type: 'password',
        name: 'adminToken',
        message: 'Enter admin token:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Admin token is required';
          }
          return true;
        }
      }
    ]);

    const { saveToken } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveToken',
        message: 'Save this token for future use?',
        default: true
      }
    ]);

    if (saveToken) {
      state.adminToken = adminToken;
      const storage = await loadStorage();
      storage.adminToken = adminToken;
      await saveStorage(storage);
    }

    return adminToken;
  } catch (error) {
    return null;
  }
}
