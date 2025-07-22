import { PrismaClient } from '../prisma/generated/prisma';

// cache prisma client in global scope
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = global as unknown as { prisma: PrismaClient };


export function getPrisma() {
    const prisma = globalForPrisma.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
    return prisma;
}