import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { savePushSubscription, PushSubscription } from "../../../../../lib/pushNotifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid push subscription data" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;

    // Save the push subscription to database
    await savePushSubscription(
      session.user.id,
      subscription as PushSubscription,
      userAgent
    );

    return NextResponse.json({ 
      message: "Push notification subscription saved successfully" 
    });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 