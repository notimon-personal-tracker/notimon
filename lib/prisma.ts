import { PrismaClient } from '../prisma/generated/prisma';

// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function findOrCreateTelegramUser(telegramData: {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}) {
  const { id, username, first_name, last_name } = telegramData;

  return prisma.user.upsert({
    where: { telegramId: id },
    update: {
      username,
      firstName: first_name,
      lastName: last_name,
      lastMessageAt: new Date(),
    },
    create: {
      telegramId: id,
      username,
      firstName: first_name,
      lastName: last_name,
      lastMessageAt: new Date(),
    },
  });
} 