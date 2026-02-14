#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('openwork')
  .description('OpenWork — open-source multi-agent AI coworker for teams')
  .version('0.1.0');

program
  .command('setup')
  .description('Launch the setup wizard to configure your AI team')
  .action(() => {
    console.log('🚧 Setup wizard not implemented yet');
  });

program
  .command('start')
  .description('Start the OpenWork server and all configured agents')
  .action(() => {
    console.log('🚧 Start not implemented yet');
  });

program
  .command('status')
  .description('Show status of all agents and integrations')
  .action(() => {
    console.log('🚧 Status not implemented yet');
  });

program
  .command('agents')
  .description('List and manage specialist agents')
  .action(() => {
    console.log('🚧 Agents management not implemented yet');
  });

program.parse();
