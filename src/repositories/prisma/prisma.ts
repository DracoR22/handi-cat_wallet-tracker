import { PrismaClient } from '@prisma/client'
import { withPulse } from '@prisma/extension-pulse'

const prismaClientWithExtensions = new PrismaClient().$extends(
  withPulse({
    apiKey: process.env.PULSE_API_KEY as string
  })
)

type PrismaClientWithExtensions = typeof prismaClientWithExtensions

declare global {
  var prisma: PrismaClientWithExtensions | undefined
}

const prisma = globalThis.prisma || new PrismaClient().$extends(
  withPulse({
    apiKey: process.env.PULSE_API_KEY as string
  })
)

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma