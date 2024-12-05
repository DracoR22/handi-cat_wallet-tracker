import { PrismaClient } from '@prisma/client'
import { bot } from '../src/providers/telegram'
import { MAX_WHALE_WALLETS } from '../src/constants/pricing'
import chalk from 'chalk'

const prisma = new PrismaClient()

// Function to send messages to users
const sendMessage = async () => {
  console.info(chalk.yellow('Fetching eligible users...'))
  try {
    const allUsers = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [{ userSubscription: null }, { userSubscription: { plan: 'FREE' } }],
          },
          { userPromotions: { none: {} } },
        ],
      },
    })

    console.info(chalk.bold.green(`Found ${allUsers.length} eligible users.`))

    if (allUsers.length === 0) {
      console.warn(chalk.bold.red('No eligible users found. Exiting...'))
      return
    }

    for (const user of allUsers) {
      try {
        await bot.sendMessage(
          user.id,
          `
⚠️ Important Update ⚠️

This is your LAST CHANCE to get a <b>LIFETIME</b> plan! 🚨 Starting next week, we’re switching to a subscription-based model.

Upgrade now to track up to <b>${MAX_WHALE_WALLETS}</b> wallets with a one-time payment — no recurring fees! 🐾

🔗 Don't miss out on this opportunity to lock in a lifetime plan before it's gone forever.

🕒 Offer ends soon — act fast! ⏳
`,
          {
            parse_mode: 'HTML',
          },
        )
        console.info(chalk.bold.green(`Message sent successfully to user with ID: ${user.id}`))
        await messageDelay(100) // Delay to avoid hitting rate limits
      } catch (error) {
        console.log(chalk.bold.red(`Failed to send message to user with ID: ${user.id}`))
      }
    }

    console.info(chalk.bold.green('All messages sent successfully.'))
  } catch (error) {
    console.error('Error occurred while fetching users or sending messages:', error)
  } finally {
    await prisma.$disconnect()
    console.info(chalk.bold.yellow('Prisma connection closed.'))
  }
}

// Utility function for delaying between messages
function messageDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Invoke the sendMessage function
sendMessage()
