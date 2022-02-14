import { PrismaClient } from '@prisma/client'
import { ContextFunction } from 'apollo-server-core'
import { ExpressContext } from 'apollo-server-express'

export interface Context {
  prisma: PrismaClient
}

const prisma = new PrismaClient()

// export const context: Context = {
//   prisma: prisma,
// }


export const context: ContextFunction<ExpressContext, object> = ({req}) => {
  console.log('body', req.body)
  return {
    prisma: prisma
  }
}