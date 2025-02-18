import { PrismaClient } from '@prisma/client'
import { bot } from '../src/providers/telegram'
import { MAX_WHALE_WALLETS } from '../src/constants/pricing'
import chalk from 'chalk'
import { SUGGEST_UPGRADE_SUBMENU, UPGRADE_PLAN_SUB_MENU } from '../src/config/bot-menus'

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
⚠️ Important Notice ⚠️

To ensure optimal performance for our premium users, all <b>FREE Wallets</b> have been cleaned up.

Upgrade your plan today to enjoy:
✅ Unlimited wallet tracking – Never lose access to your wallets
✅ Lightning-fast notifications – Stay ahead with real-time alerts
✅ Exclusive premium features – Unlock powerful tools for a better tracking experience

Don’t miss out—upgrade now to keep your wallets secure and fully tracked!
Plans starting from <b>0.1 SOL</b>
`,
          {
            parse_mode: 'HTML',
            reply_markup: SUGGEST_UPGRADE_SUBMENU,
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
