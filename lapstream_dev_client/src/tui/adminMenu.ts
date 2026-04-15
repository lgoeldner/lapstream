import inquirer from 'inquirer';
import chalk from 'chalk';
import { AuthApi } from '../api/auth.js';
import { ApiClient } from '../api/client.js';
import { AppState, Role, OtpClaim, GeneratedOtp } from '../types/api.js';
import { promptForAdminToken } from './adminAuthPrompt.js';
import { showReceptionMenu } from './receptionMenu.js';
import { showLaneAssignMenu } from './laneAssignMenu.js';

type BypassRole = 'reception' | 'lane_assign' | 'lane_count';

export async function showAdminMenu(apiClient: ApiClient, state: AppState): Promise<void> {
  while (true) {
    console.log(chalk.blue('\n=== Admin Bypass Menu ==='));
    console.log(chalk.gray(`Device: ${state.activeDevice?.deviceName}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'select',
        name: 'action',
        message: 'Choose role submenu:',
        choices: [
          { name: 'Reception submenu', value: 'reception' },
          { name: 'Lane Assign submenu', value: 'lane_assign' },
          { name: 'Lane Count submenu', value: 'lane_count' },
          { name: 'Back to main menu', value: 'back' }
        ],
        loop: false
      }
    ]);

    if (answers.action === 'back') {
      return;
    }

    await openBypassRoleMenu(answers.action as BypassRole, apiClient, state);
  }
}

async function openBypassRoleMenu(role: BypassRole, apiClient: ApiClient, state: AppState): Promise<void> {
  if (role === 'reception') {
    await showReceptionMenu(apiClient, state);
    return;
  }

  if (role === 'lane_assign') {
    await showLaneAssignMenu(apiClient, state);
    return;
  }

  console.log(chalk.yellow('\nLane count menu is not implemented yet.'));
  await pressEnter();
}

export async function showGenerateOtpsFlow(apiClient: ApiClient, state: AppState): Promise<void> {
  console.log(chalk.blue('\n=== Generate OTPs ==='));

  const adminToken = await promptForAdminToken(state);

  if (!adminToken) {
    console.log(chalk.red('✗ Admin token is required'));
    return;
  }

  try {
    const rolesToGenerate = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'roles',
        message: 'Select device roles to generate OTPs for (or empty to cancel):',
        choices: [
          { name: 'Admin', value: 'admin' },
          { name: 'Reception', value: 'reception' },
          { name: 'Lane Assign', value: 'lane_assign' },
          { name: 'Lane Count', value: 'lane_count' }
        ]
      }
    ]);

    if (rolesToGenerate.roles.length === 0) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }

    const deviceInputs: OtpClaim[] = [];

    for (const role of rolesToGenerate.roles) {
      console.log(chalk.cyan(`\n--- Configuration for ${chalk.bold(role)} devices ---`));

      const config = await inquirer.prompt([
        {
          type: 'number',
          name: 'count',
          message: `How many ${role} devices to generate? (0 to skip this role, -1 to cancel all)`,
          default: 1,
          validate: (input: number) => {
            if (input < -1) return 'Invalid count';
            if (input > 50) return 'Cannot generate more than 50 at once';
            return true;
          }
        }
      ]);

      if (config.count === -1) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
      if (config.count === 0) continue;

      const nameConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'baseName',
          message: `Base name for ${role} devices (will be 1-indexed):`,
          default: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '),
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return 'Base name is required';
            }
            return true;
          }
        }
      ]);

      for (let i = 1; i <= config.count; i++) {
        deviceInputs.push({
          role: role as Role,
          name: config.count === 1 ? nameConfig.baseName : `${nameConfig.baseName} ${i}`
        });
      }
    }

    if (deviceInputs.length === 0) {
      console.log(chalk.yellow('\nNo devices specified.'));
      return;
    }

    console.log(chalk.gray(`\nGenerating ${deviceInputs.length} OTPs...`));

    const authApi = new AuthApi(apiClient);
    const result = await authApi.generateOTPs(adminToken, deviceInputs);

    if (result.status === 'ok' && result.data) {
      console.log(chalk.green(`\n✓ ${result.data.length} OTPs generated successfully!\n`));

      const grouped: Record<string, GeneratedOtp[]> = {};
      result.data.forEach((otp: GeneratedOtp) => {
        if (!grouped[otp.role]) grouped[otp.role] = [];
        grouped[otp.role].push(otp);
      });

      for (const [role, otps] of Object.entries(grouped)) {
        console.log(chalk.cyan.bold(`\n${role.toUpperCase()}`));
        otps.forEach((otp) => {
          console.log(chalk.white(`  ${otp.deviceName.padEnd(20)} : `) + chalk.yellow.bold(otp.otp));
        });
        console.log(chalk.gray('  ' + '─'.repeat(35)));
      }
      console.log(chalk.gray('\nNote: OTPs expire in 5 minutes.'));
    } else {
      console.log(chalk.red(`\n✗ Failed to generate OTPs: ${result.err || 'Unknown error'}`));
      if (result.err?.includes('Admin Token mismatch')) {
        console.log(chalk.red('  Invalid admin token'));
        if (state.adminToken === adminToken) {
          state.adminToken = undefined;
        }
      }
    }
  } catch (error) {
    console.log(chalk.red('\n✗ An error occurred while generating OTPs'));
    console.log(chalk.red(`  ${error instanceof Error ? error.message : 'Unknown error'}`));
  }

  await pressEnter();
}

async function pressEnter(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: '\nPress enter to continue...'
    }
  ]);
}
