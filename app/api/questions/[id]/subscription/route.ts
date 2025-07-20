import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { PrismaClient } from "../../../../../prisma/generated/prisma"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ isSubscribed: false })
    }

    // Check if user has a preference for this question
    const userPreference = await prisma.userQuestionPreference.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: id
        }
      }
    })

    const isSubscribed = userPreference?.isEnabled ?? false

    return NextResponse.json({ isSubscribed })
  } catch (error) {
    console.error("Error checking question subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 