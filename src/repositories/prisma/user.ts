import { CreateWallet } from "../../lib/create-wallet";
import { CreateUserInterface } from "../../types/interfaces";
import prisma from "./prisma";

export class PrismaUserRepository {
    private createWallet: CreateWallet
    constructor() {
        this.createWallet = new CreateWallet()
    }

    public async create({ firstName, id, lastName, username }: CreateUserInterface) {
      const  { publicKey, privateKey }  = this.createWallet.create()

      const newUser = await prisma.user.create({
        data: {
          firstName,
          id, 
          lastName,
          username,
          personalWalletPubKey: publicKey,
          personalWalletPrivKey: privateKey
        }
      })

      return newUser
    }

    public async getById(userId: string) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }, select: {
                id: true
            }
        })

        return user
    }

    public async getPersonalWallet(userId: string) {
      const walletBalance = await prisma.user.findUnique({
        where: {
          id: userId
        },
        select: {
            personalWalletPubKey: true,
            personalWalletPrivKey: true
        }
      })

      return walletBalance
    }
}