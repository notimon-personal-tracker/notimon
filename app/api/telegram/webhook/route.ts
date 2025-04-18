import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// Initialize the bot with your token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });

export async function POST(req: Request) {
  try {
    const update = await req.json();
    
    // Handle incoming messages
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Respond with "You said" followed by the message
      await bot.sendMessage(chatId, `You said: ${text}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
} 