import { PrismaClient } from '@prisma/client'
import * as fs from 'fs/promises'

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('Cleaning up the database...')

    await prisma.userSubscription.deleteMany()
    await prisma.userWallet.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.user.deleteMany()

    console.log('Database cleaned successfully!')

    // Read the backup file
    const data = await fs.readFile('database_backup.json', 'utf-8')

    // Parse the JSON data
    const backupData = JSON.parse(data)

    // Destructure the data from the backup
    const { users, wallets, userWallets, userSubscriptions } = backupData

    // Insert data into the database
    // Step 1: Insert users
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          hasDonated: user.hasDonated,
          personalWalletPubKey: user.personalWalletPubKey,
          personalWalletPrivKey: user.personalWalletPrivKey,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      })
    }

    // Step 2: Insert wallets
    for (const wallet of wallets) {
      await prisma.wallet.create({
        data: {
          id: wallet.id,
          address: wallet.address,
        },
      })
    }

    // Step 3: Insert userWallets
    for (const userWallet of userWallets) {
      await prisma.userWallet.create({
        data: {
          userId: userWallet.userId,
          walletId: userWallet.walletId,
          name: userWallet.name,
          address: userWallet.address,
          handiCatStatus: userWallet.handiCatStatus,
          status: userWallet.status,
        },
      })
    }

    // Step 4: Insert user subscriptions
    for (const subscription of userSubscriptions) {
      await prisma.userSubscription.create({
        data: {
          id: subscription.id,
          plan: subscription.plan,
          isCanceled: subscription.isCanceled,
          subscriptionCurrentPeriodEnd: subscription.subscriptionCurrentPeriodEnd
            ? new Date(subscription.subscriptionCurrentPeriodEnd)
            : null,
          createdAt: new Date(subscription.createdAt),
          updatedAt: new Date(subscription.updatedAt),
          userId: subscription.userId,
        },
      })
    }

    console.log('Database successfully seeded from backup!')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
