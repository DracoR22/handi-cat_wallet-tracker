import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanUpOrphanedWallets() {
  try {
    await prisma.userWallet.deleteMany({
      where: {
        user: {
          AND: [
            {
              OR: [{ userSubscription: null }, { userSubscription: { plan: 'FREE' } }],
            },
            { userPromotions: { none: {} } },
          ],
        },
      },
    })

    await prisma.wallet.deleteMany({
      where: {
        userWallets: {
          none: {},
        },
      },
    })

    console.log('Orphaned wallets and userWallets cleaned up successfully!')
  } catch (error) {
    console.error('Error cleaning up orphaned wallets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the cleanup
cleanUpOrphanedWallets()
