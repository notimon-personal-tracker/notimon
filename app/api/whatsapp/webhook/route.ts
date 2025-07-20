import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUserByChannel, prisma } from '@/lib/prisma';
import { sendWhatsappMessage } from '@/lib/whatsapp';
import { sendNextQuestionToUser } from '@/lib/sendDailyQuestions';
import { Channel } from '@/prisma/generated/prisma';
import * as crypto from 'crypto';

export async function GET(req: NextRequest) {
  const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN;

  if (!expectedToken) {
    console.error('WHATSAPP_WEBHOOK_TOKEN is not set in environment variables');
    return new NextResponse('Configuration error', { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');

  if (mode === 'subscribe' && token && token.length == expectedToken.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
    const challenge = params.get('hub.challenge');
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

async function isAuthenticRequest(signature: string | null, body: string) {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) {
    console.error('FACEBOOK_APP_SECRET is not set in environment variables');
    return false;
  }
  
  console.log(signature);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  if (!signature) {
    console.error('x-hub-signature-256 is not set in request headers');
    return false;
  }
  const signatureHash = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signatureHash, 'hex')
  );
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256');
  const body = await req.text();
  if (!await isAuthenticRequest(signature, body))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const update = JSON.parse(body);
  console.log("whatsapp webhook received", JSON.stringify(update, null, 2));

  // Handle WhatsApp messages
  if (update.entry && update.entry[0] && update.entry[0].changes) {
    for (const change of update.entry[0].changes) {
      if (change.field === 'messages' && change.value.messages) {
        for (const message of change.value.messages) {
          const from = message.from;
          
          // Handle interactive list responses
          if (message.interactive && message.interactive.type === 'list_reply') {
            const listReply = message.interactive.list_reply;
            console.log(`Received list response: ${listReply.id} (${listReply.title}) from ${from}`);
            
            const user = await findOrCreateUserByChannel(
              Channel.WHATSAPP,
              from,
              {}
            );
            
            // Send the next question in the sequence
            const sentNext = await sendNextQuestionToUser(
              user.id,
              Channel.WHATSAPP,
              from
            );
            
            if (!sentNext) {
              // No more questions for today
              await sendWhatsappMessage(
                from,
                '✅ That\'s all your questions for today! Thank you for participating.'
              );
            }
            continue;
          }
          
          // Handle regular text messages
          const text = message.text?.body;
          if (from && text) {
            // Handle start command or template response
            if (text.toLowerCase() === 'yes' || text.toLowerCase() === 'start') {
              // User is starting or continuing the sequence
              const user = await findOrCreateUserByChannel(
                Channel.WHATSAPP,
                from,
                { 
                  // WhatsApp doesn't provide username/firstName/lastName in message
                }
              );
              
              // Send the first/next question
              const sentNext = await sendNextQuestionToUser(
                user.id,
                Channel.WHATSAPP,
                from
              );
              
              if (!sentNext) {
                await sendWhatsappMessage(
                  from,
                  '✅ That\'s all your questions for today! Thank you for participating.'
                );
              }
            } else {
              // Regular message - just echo back
              await findOrCreateUserByChannel(Channel.WHATSAPP, from, {});
              await sendWhatsappMessage(from, `You said: ${text}`);
            }
          }
        }
      }
    }
  }

  return NextResponse.json("", { status: 200 });
} 