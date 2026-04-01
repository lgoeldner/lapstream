import inquirer from 'inquirer';
import chalk from 'chalk';
import { ApiClient } from '../api/client.js';
import { AppState, Role, DeviceProfile } from '../types/api.js';
import { showAuthMenu } from './authMenu.js';
import { showAdminMenu } from './adminMenu.js';
import { showReceptionMenu } from './receptionMenu.js';
import { showLaneAssignMenu } from './laneAssignMenu.js';

export async function showMainMenu(apiClient: ApiClient, state: AppState): Promise<void> {
  // Try to connect to API first
  try {
    const health = await apiClient.healthCheck();
    if (!health.ok) {
      console.log(chalk.red('⚠ Warning: API health check failed'));
    }
  } catch (error) {
    console.log(chalk.red('✗ Cannot connect to API'));
    console.log(chalk.red(`  ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray(`  Is the server running on ${state.apiBaseUrl}?`));

    const { tryAgain } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'tryAgain',
        message: 'Try again?',
        default: true
      }
    ]);

    if (!tryAgain) {
      return;
    }
  }

  while (true) {
    console.clear();
    console.log(chalk.cyan.bold('╔════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║      LapStream Development Client      ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════╝'));

    if (state.activeDevice) {
      console.log(chalk.green(`\nActive Device: ${chalk.white.bold(state.activeDevice.deviceName)}`));
      console.log(chalk.gray(`Role: ${chalk.white(state.activeDevice.role)}`));
      console.log(chalk.gray(`API: ${chalk.white(state.apiBaseUrl)}`));
    } else {
      console.log(chalk.yellow('\nStatus: No active device'));
      console.log(chalk.gray(`API: ${chalk.white(state.apiBaseUrl)}`));
    }

    if (state.savedDevices.length > 0) {
      console.log(chalk.gray(`Saved devices: ${state.savedDevices.length}`));
    }

    const choices = [];

    // Device-specific actions
    if (state.activeDevice) {
      choices.push({ name: `Open ${state.activeDevice.role} menu`, value: 'role_menu' });
      choices.push({ name: 'Deactivate current device', value: 'deactivate' });
    }

    // General actions
    if (state.savedDevices.length > 0) {
      choices.push({ name: 'Switch to another saved device', value: 'switch' });
    }
    
    choices.push({ name: 'Enroll new device (OTP required)', value: 'enroll' });
    choices.push({ name: 'Generate OTPs (Admin token required)', value: 'generate_otps' });
    choices.push({ name: 'Exit', value: 'exit' });

    const answers = await inquirer.prompt([
      {
        type: 'select',
        name: 'action',
        message: 'Main Menu:',
        choices: choices
      }
    ]);

    switch (answers.action) {
      case 'role_menu':
        if (state.activeDevice) {
          apiClient.setCredentials(state.activeDevice.credentials);
          switch (state.activeDevice.role) {
            case 'admin': await showAdminMenu(apiClient, state); break;
            case 'reception': await showReceptionMenu(apiClient, state); break;
            case 'lane_assign': await showLaneAssignMenu(apiClient, state); break;
            default:
              console.log(chalk.yellow(`\n⚠ Role ${state.activeDevice.role} menu not implemented`));
              await pressEnter();
          }
        }
        break;

      case 'deactivate':
        state.activeDevice = undefined;
        apiClient.setCredentials(undefined as any);
        break;

      case 'switch':
        await switchDeviceFlow(state, apiClient);
        break;

      case 'enroll':
        await showAuthMenu(apiClient, state);
        break;

      case 'generate_otps':
        // Generate OTPs is always available from adminMenu logic
        // but we want to call it directly if possible
        await showAdminMenu(apiClient, state, true); 
        break;

      case 'exit':
        return;
    }
  }
}

async function switchDeviceFlow(state: AppState, apiClient: ApiClient): Promise<void> {
  const choices = state.savedDevices.map(d => ({
    name: `${d.deviceName} (${d.role})`,
    value: d
  }));
  choices.push({ name: 'Cancel', value: null as any });

  const { device } = await inquirer.prompt([
    {
      type: 'select',
      name: 'device',
      message: 'Select device to activate:',
      choices: choices
    }
  ]);

  if (device) {
    state.activeDevice = device;
    apiClient.setCredentials(device.credentials);
    console.log(chalk.green(`\n✓ Switched to ${device.deviceName}`));
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

async function pressEnter(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press enter to continue...'
    }
  ]);
}
