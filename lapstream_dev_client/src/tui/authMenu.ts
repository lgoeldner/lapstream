import inquirer from 'inquirer';
import chalk from 'chalk';
import { AuthApi } from '../api/auth.js';
import { ApiClient } from '../api/client.js';
import { AppState } from '../types/api.js';

import { addDevice } from '../config/storage.js';

export async function showAuthMenu(apiClient: ApiClient, state: AppState): Promise<void> {
  console.log(chalk.blue('\n=== Device Enrollment ==='));
  console.log(chalk.gray('Enter the 6-digit OTP to enroll this device\n'));

  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'otp',
        message: 'OTP (or leave empty to cancel):',
        validate: (input: string) => {
          if (input === '') return true;
          if (!/^\d{6}$/.test(input)) {
            return 'OTP must be exactly 6 digits';
          }
          return true;
        }
      }
    ]);

    if (answers.otp === '') {
      console.log(chalk.yellow('\nEnrollment cancelled.'));
      return;
    }

    const authApi = new AuthApi(apiClient);
    const result = await authApi.enrollDevice(answers.otp);

    if (result.status === 'ok' && result.data) {
      console.log(chalk.green('\n✓ Device enrolled successfully!'));
      console.log(chalk.gray(`Device: ${result.data.deviceName}`));
      console.log(chalk.gray(`Role: ${result.data.role}`));

      const profile = {
        deviceName: result.data.deviceName,
        role: result.data.role,
        credentials: result.data.credentials
      };

      await addDevice(profile);
      
      // Update state
      state.activeDevice = profile;
      if (!state.savedDevices.some(d => d.deviceName === profile.deviceName && d.role === profile.role)) {
        state.savedDevices.push(profile);
      } else {
        const idx = state.savedDevices.findIndex(d => d.deviceName === profile.deviceName && d.role === profile.role);
        state.savedDevices[idx] = profile;
      }
      
      apiClient.setCredentials(profile.credentials);

      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press enter to continue...'
        }
      ]);
    } else {
      console.log(chalk.red(`\n✗ Enrollment failed: ${result.err || 'Unknown error'}`));
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press enter to continue...'
        }
      ]);
    }
  } catch (error) {
    console.log(chalk.red('\n✗ An error occurred during enrollment'));
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press enter to continue...'
      }
    ]);
  }
}
