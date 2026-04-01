import inquirer from 'inquirer';
import chalk from 'chalk';
import { PlayersApi } from '../api/players.js';
import { ApiClient } from '../api/client.js';
import { AppState, Player } from '../types/api.js';

export async function showReceptionMenu(apiClient: ApiClient, state: AppState): Promise<void> {
  const playersApi = new PlayersApi(apiClient);

  while (true) {
    console.log(chalk.blue('\n=== Reception Menu ==='));
    console.log(chalk.gray(`Device: ${state.activeDevice?.deviceName}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'select',
        name: 'action',
        message: 'Choose action:',
        choices: [
          { name: 'Register new player', value: 'create_player' },
          { name: 'List all players', value: 'list_players' },
          { name: 'View player details', value: 'view_player' },
          { name: 'Remove player from lane', value: 'remove_from_lane' },
          { name: 'Back to main menu', value: 'back' }
        ]
      }
    ]);

    switch (answers.action) {
      case 'create_player':
        await createPlayerFlow(playersApi);
        break;
      case 'list_players':
        await listPlayersFlow(playersApi);
        break;
      case 'view_player':
        await viewPlayerFlow(playersApi);
        break;
      case 'remove_from_lane':
        await removeFromLaneFlow(playersApi);
        break;
      case 'back':
        return;
    }
  }
}

async function createPlayerFlow(playersApi: PlayersApi): Promise<void> {
  console.log(chalk.blue('\n=== Register New Player ==='));
  console.log(chalk.gray('Enter player details (leave name empty to cancel)\n'));

  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Player name:',
      },
      {
        type: 'number',
        name: 'age',
        message: 'Player age:',
        when: (ans) => ans.name !== '',
        validate: (input: number) => {
          if (!input || input < 1 || input > 120) {
            return 'Please enter a valid age';
          }
          return true;
        }
      }
    ]);

    if (answers.name === '') {
      console.log(chalk.yellow('\nOperation cancelled.'));
      return;
    }

    const result = await playersApi.create(answers.name, answers.age);

    if (result.status === 'ok' && result.data) {
      console.log(chalk.green('\n✓ Player registered successfully!'));
      console.log(chalk.gray(`Name: ${result.data.name}`));
      console.log(chalk.gray(`Age: ${result.data.age}`));
      console.log(chalk.gray(`ID: ${result.data.id}`));
    } else {
      console.log(chalk.red(`\n✗ Failed to register player: ${result.err || 'Unknown error'}`));
    }
  } catch (error) {
    console.log(chalk.red('\n✗ An error occurred'));
    console.log(chalk.red(`  ${error instanceof Error ? error.message : 'Unknown error'}`));
  }

  await pressEnter();
}

async function listPlayersFlow(playersApi: PlayersApi): Promise<void> {
  console.log(chalk.blue('\n=== All Players ===\n'));

  const result = await playersApi.getAll();

  if (result.status === 'ok' && result.data) {
    if (result.data.length === 0) {
      console.log(chalk.yellow('No players registered yet'));
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

async function viewPlayerFlow(playersApi: PlayersApi): Promise<void> {
  console.log(chalk.blue('\n=== View Player Details ==='));
  console.log(chalk.gray('Enter player ID (0 to cancel)\n'));

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'playerId',
      message: 'Enter player ID:',
      validate: (input: number) => {
        if (input === 0) return true;
        if (!input || input < 1) {
          return 'Please enter a valid player ID';
        }
        return true;
      }
    }
  ]);

  if (answers.playerId === 0) {
    console.log(chalk.yellow('\nOperation cancelled.'));
    return;
  }

  const result = await playersApi.getById(answers.playerId);

  if (result.status === 'ok' && result.data) {
    console.log(chalk.white('\nPlayer Details:'));
    console.log(chalk.gray('  ID:'), chalk.white(result.data.id));
    console.log(chalk.gray('  Name:'), chalk.white(result.data.name));
    console.log(chalk.gray('  Age:'), chalk.white(result.data.age));
  } else {
    console.log(chalk.red(`\n✗ Player not found: ${result.err || 'Unknown error'}`));
  }

  await pressEnter();
}

async function removeFromLaneFlow(playersApi: PlayersApi): Promise<void> {
  console.log(chalk.blue('\n=== Remove Player From Lane ==='));
  console.log(chalk.gray('Enter player ID (0 to cancel)\n'));

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'playerId',
      message: 'Enter player ID to remove from lane:',
      validate: (input: number) => {
        if (input === 0) return true;
        if (!input || input < 1) {
          return 'Please enter a valid player ID';
        }
        return true;
      }
    }
  ]);

  if (answers.playerId === 0) {
    console.log(chalk.yellow('\nOperation cancelled.'));
    return;
  }

  const result = await playersApi.removeFromLane(answers.playerId);

  if (result.status === 'ok' && result.data) {
    console.log(chalk.green('\n✓ Player removed from lane successfully'));
    console.log(chalk.gray(`Lane ${result.data.pace_group}${result.data.slot_index} is now available`));
  } else {
    console.log(chalk.red(`\n✗ Failed to remove player: ${result.err || 'Unknown error'}`));
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
