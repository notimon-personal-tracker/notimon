import { NextResponse } from 'next/server';
import { findOrCreateUserByChannel, prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram';
import { sendNextQuestionToUser } from '@/lib/sendDailyQuestions';
import * as crypto from 'crypto'
import { Channel } from '@/prisma/generated/prisma';

function isAuthenticRequest(req: Request) {
  const authHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!process.env.TELEGRAM_WEBHOOK_SECRET)
    throw new Error('TELEGRAM_WEBHOOK_SECRET is not set in environment variables');

  if (!authHeader)
    return false
  
  return crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(process.env.TELEGRAM_WEBHOOK_SECRET))
}

export async function POST(req: Request) {
    if (!isAuthenticRequest(req))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const update = await req.json();
    
    // Handle incoming messages
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Handle /start command
      if (text === '/start') {
        await sendMessage(
          chatId,
          '👋 Welcome! I\'m your notification bot.\n\n' +
          'Your account will be created automatically when you send your first message. ' +
          'Feel free to start chatting!'
        );
        
        return NextResponse.json({ ok: true });
      }
      
      // Create or update user
      const user = await findOrCreateUserByChannel(
        Channel.TELEGRAM,
        update.message.from.id.toString(),
        {
          username: update.message.from.username,
          firstName: update.message.from.first_name,
          lastName: update.message.from.last_name,
        }
      );

      // Check if this is a response from a reply keyboard (question answer)
      // We can identify this by checking if the user has an active question sequence
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hasActiveSequence = await prisma.dailyQuestionSequence.findFirst({
        where: {
          userId: user.id,
          date: today,
        },
      });

      if (hasActiveSequence) {
        // This is likely a response to a question - send the next question
        const sentNext = await sendNextQuestionToUser(
          user.id, 
          Channel.TELEGRAM, 
          chatId.toString()
        );
        
        if (!sentNext) {
          // No more questions for today
          await sendMessage(
            BigInt(chatId),
            '✅ That\'s all your questions for today! Thank you for participating.'
          );
        }
      } else {
        // Regular message - just echo back
        const response = await sendMessage(BigInt(update.message.chat.id), `You said: ${text}`);
        console.log("Telegram API response", response);
      }
    }

    return NextResponse.json({ ok: true });
  
} 
