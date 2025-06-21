import { PrismaClient, Channel } from '../prisma/generated/prisma';

// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function findOrCreateUserByChannel(
  channel: Channel,
  channelUserId: string,
  userData: {
    username?: string;
    firstName?: string;
    lastName?: string;
  }
) {
  const existingChannel = await prisma.userChannel.findUnique({
    where: {
      channel_channelUserId: {
        channel,
        channelUserId,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingChannel) {
    // Update user data if it has changed
    return prisma.user.update({
      where: { id: existingChannel.userId },
      data: {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        lastMessageAt: new Date(),
      },
    });
  }

  // Create a new user and channel
  return prisma.user.create({
    data: {
      ...userData,
      lastMessageAt: new Date(),
      channels: {
        create: {
          channel,
          channelUserId,
        },
      },
    },
  });
}

export async function findOrCreateWhatsappUser(whatsappData: {
  id: string;
  // Add more fields as needed
}) {
  // TODO: Implement this after updating the User model for WhatsApp
  return null;
} 