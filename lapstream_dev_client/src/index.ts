#!/usr/bin/env node

import { getConfig } from './config/env.js';
import { ApiClient } from './api/client.js';
import { AppState } from './types/api.js';
import { showMainMenu } from './tui/mainMenu.js';
import { loadStorage } from './config/storage.js';
import chalk from 'chalk';

process.on('SIGINT', () => {
  console.log('\n\n' + chalk.yellow('Gracefully exiting LapStream Development Client...'));
  process.exit(0);
});

function ensureInteractiveTty(): void {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('This client requires an interactive TTY for list menus.');
    console.error('Run it from a real terminal, not a non-interactive runner.');
    console.error('Example: `npm run dev` inside your terminal.');
    process.exit(1);
  }
}

async function main() {
  ensureInteractiveTty();
  // Get configuration
  const config = getConfig();

  // Create API client
  const apiClient = new ApiClient(config.apiBaseUrl);

  // Load saved storage
  const storage = await loadStorage();

  // Initialize app state
  const state: AppState = {
    apiBaseUrl: config.apiBaseUrl,
    savedDevices: storage.savedDevices,
    adminToken: storage.adminToken
  };

  // Link state to apiClient for automatic refresh updates
  apiClient.setState(state);

  try {
    await showMainMenu(apiClient, state);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
