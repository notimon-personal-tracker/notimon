import { NextResponse } from 'next/server';
import { findOrCreateTelegramUser } from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram';
import * as crypto from 'crypto'



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
      await findOrCreateTelegramUser({
        id: update.message.from.id,
        username: update.message.from.username,
        first_name: update.message.from.first_name,
        last_name: update.message.from.last_name,
      });
      
      const response = await sendMessage(chatId, `You said: ${text}`);
      console.log("Telegram API response", response);
    }

    return NextResponse.json({ ok: true });
  
} 
