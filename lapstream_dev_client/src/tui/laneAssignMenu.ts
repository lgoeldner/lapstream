import inquirer from 'inquirer';
import chalk from 'chalk';
import { LanesApi } from '../api/lanes.js';
import { PlayersApi } from '../api/players.js';
import { ApiClient } from '../api/client.js';
import { AppState, Player } from '../types/api.js';

export async function showLaneAssignMenu(apiClient: ApiClient, state: AppState): Promise<void> {
  const lanesApi = new LanesApi(apiClient);
  const playersApi = new PlayersApi(apiClient);

  while (true) {
    console.log(chalk.blue('\n=== Lane Assignment Menu ==='));
    console.log(chalk.gray(`Device: ${state.activeDevice?.deviceName}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'select',
        name: 'action',
        message: 'Choose action:',
        choices: [
          { name: 'Assign player to lane', value: 'assign_player' },
          { name: 'Unassign player from lane', value: 'unassign_player' },
          { name: 'List all players', value: 'list_players' },
          { name: 'Back to main menu', value: 'back' }
        ]
      }
    ]);

    switch (answers.action) {
      case 'assign_player':
        await assignPlayerFlow(lanesApi, playersApi);
        break;
      case 'unassign_player':
        await unassignPlayerFlow(lanesApi);
        break;
      case 'list_players':
        await listPlayersFlow(playersApi);
        break;
      case 'back':
        return;
    }
  }
}

async function assignPlayerFlow(lanesApi: LanesApi, playersApi: PlayersApi): Promise<void> {
  console.log(chalk.blue('\n=== Assign Player to Lane ===\n'));

  try {
    const playersResult = await playersApi.getAll();
    if (playersResult.status !== 'ok' || !playersResult.data || playersResult.data.length === 0) {
      console.log(chalk.yellow('No players available for assignment'));
      await pressEnter();
      return;
    }

    const c = await lanesApi.getPaceGroups();
    if (c.status !== 'ok' || !c.data) return console.log(chalk.red(`\n✗ Failed to fetch pace groups: ${c.err || 'Unknown error'}`));



    const choices = [
      ...c.data.map(gr => ({
        name: `Group ${gr.name} (${gr.count} lanes)`,
        value: { name: gr.name, count: gr.count }
      })),
      { name: chalk.yellow('Cancel'), value: 'cancel' }
    ];

    const answers = await inquirer.prompt([
      {
        type: 'select',
        name: 'paceGroup',
        message: 'Select pace group:',
        choices: choices
      },
      {
        type: 'number',
        name: 'position',
        message: (ans) => `Lane position index (0..${ans.paceGroup?.count - 1}; -1 to cancel):`,
        when: (ans) => ans.paceGroup !== 'cancel',
        validate: (input: number, ans: { paceGroup: { count: number } }) => {
          if (input === -1) return true;
          if (!input || input < 0 || input > ans.paceGroup.count - 1) {
            return `Position must be between 0 and ${ans.paceGroup.count - 1}`;
          }
          return true;
        }
      },
      {
        type: 'select',
        name: 'playerId',
        message: 'Select player:',
        when: (ans) => ans.paceGroup !== 'cancel' && ans.position !== 0,
        choices: [
          ...playersResult.data.map((player: Player) => ({
            name: `${player.name} (ID: ${player.id}, Age: ${player.age})`,
            value: player.id
          })),
          { name: chalk.yellow('Cancel'), value: 'cancel' }
        ]
      }
    ]);

    if (answers.paceGroup === 'cancel' || answers.position === -1 || answers.playerId === 'cancel') {
      console.log(chalk.yellow('\nOperation cancelled.'));
      return;
    }
    console.log(chalk.gray(`Assigning player ID ${answers.playerId} to lane ${answers.paceGroup.name}${answers.position}...`));
    const result = await lanesApi.assignPlayer(answers.paceGroup.name, answers.position, answers.playerId);

    if (result.status === 'ok' && result.data) {
      console.log(chalk.green('\n✓ Player assigned to lane successfully!'));
      console.log(chalk.gray(`Lane: ${result.data.pace_group}${result.data.slot_index}`));
      console.log(chalk.gray(`Player ID: ${result.data.assigned_player}`));
    } else {
      console.log(chalk.red(`\n✗ Failed to assign player: ${result.err || 'Unknown error'}`));
    }
  } catch (error) {
    console.log(chalk.red('\n✗ An error occurred'));
    console.log(chalk.red(`  ${error instanceof Error ? error.message : 'Unknown error'}`));
  }

  await pressEnter();
}

async function unassignPlayerFlow(lanesApi: LanesApi): Promise<void> {
  console.log(chalk.blue('\n=== Unassign Player From Lane ===\n'));

  try {
    const choices = [
      ...['A', 'B', 'C'].map(group => ({
        name: `Group ${group}`,
        value: group
      })),
      { name: chalk.yellow('Cancel'), value: 'cancel' }
    ];

    const answers = await inquirer.prompt([
      {
        type: 'select',
        name: 'paceGroup',
        message: 'Select pace group:',
        choices: choices
      },
      {
        type: 'number',
        name: 'position',
        message: 'Lane position (1-8, 0 to cancel):',
        when: (ans) => ans.paceGroup !== 'cancel',
        validate: (input: number) => {
          if (input === 0) return true;
          if (!input || input < 1 || input > 8) {
            return 'Position must be between 1 and 8';
          }
          return true;
        }
      }
    ]);

    if (answers.paceGroup === 'cancel' || answers.position === 0) {
      console.log(chalk.yellow('\nOperation cancelled.'));
      return;
    }

    const result = await lanesApi.unassignPlayer(answers.paceGroup, answers.position);

    if (result.status === 'ok' && result.data) {
      console.log(chalk.green('\n✓ Player unassigned from lane successfully'));
      console.log(chalk.gray(`Lane ${result.data.pace_group}${result.data.slot_index} is now available`));
    } else {
      console.log(chalk.red(`\n✗ Failed to unassign player: ${result.err || 'Unknown error'}`));
    }
  } catch (error) {
    console.log(chalk.red('\n✗ An error occurred'));
    console.log(chalk.red(`  ${error instanceof Error ? error.message : 'Unknown error'}`));
  }

  await pressEnter();
}

async function listPlayersFlow(playersApi: PlayersApi): Promise<void> {
  console.log(chalk.blue('\n=== Available Players ===\n'));

  const result = await playersApi.getAll();

  if (result.status === 'ok' && result.data) {
    if (result.data.length === 0) {
      console.log(chalk.yellow('No players registered'));
    } else {
      console.log(chalk.gray('ID  | Name                    | Age'));
      console.log(chalk.gray('────┼─────────────────────────┼─────'));

      result.data.forEach((player: Player) => {
        const id = player.id.toString().padEnd(3);
        const name = player.name.padEnd(23);
        const age = player.age.toString().padEnd(5);
        console.log(chalk.white(`${id} │ ${name} │ ${age}`));
      });

      console.log(chalk.gray(`\nTotal: ${result.data.length} players`));
    }
  } else {
    console.log(chalk.red(`\n✗ Failed to list players: ${result.err || 'Unknown error'}`));
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
