import { PrismaClient } from '@prisma/client'
import * as fs from 'fs/promises'

const prisma = new PrismaClient()

async function backupDatabase() {
  try {
    // Fetch all data from each table
    const users = await prisma.user.findMany({
      include: {
        userSubscription: true,
        userWallets: true,
      },
    })

    const wallets = await prisma.wallet.findMany({
      include: {
        userWallets: true,
      },
    })

    const userWallets = await prisma.userWallet.findMany()

    const userSubscriptions = await prisma.userSubscription.findMany()

    // Create a backup object
    const backupData = {
      users,
      wallets,
      userWallets,
      userSubscriptions,
    }

    // Convert the backup data to JSON format
    const backupJson = JSON.stringify(backupData, null, 2)

    // Write the JSON data to a file
    await fs.writeFile('database_backup.json', backupJson)

    console.log('Backup completed successfully! Data saved to database_backup.json')
  } catch (error) {
    console.error('Error during backup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

backupDatabase()
