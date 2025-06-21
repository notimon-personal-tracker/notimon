import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateWhatsappUser } from '@/lib/prisma';
import { sendWhatsappMessage } from '@/lib/whatsapp';
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

  //if(body.field !== 'messages'){
  // not from the messages webhook so dont process
  console.log("whatsapp webhook received", JSON.stringify(update, null, 2))
  return NextResponse.json("", { status: 200 })
  //}
  /*const message = body.value.message
 
  if (from && text) {
    if (text.toLowerCase() === 'start') {
      await sendWhatsappMessage(
        from,
        '👋 Welcome! I\'m your notification bot.\n\nYour account will be created automatically when you send your first message. Feel free to start chatting!'
      );
      return NextResponse.json({ ok: true });
    }
 
    await findOrCreateWhatsappUser({ id: from });
    await sendWhatsappMessage(from, `You said: ${text}`);
  }
 
  return NextResponse.json({ ok: true });*/
} 