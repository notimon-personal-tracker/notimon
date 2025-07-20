import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { PrismaClient } from "../../../../../prisma/generated/prisma"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify question exists and is active
    const question = await prisma.question.findUnique({
      where: {
        id: id,
        isActive: true
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Subscribe to the question (upsert to handle existing preferences)
    await prisma.userQuestionPreference.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: id
        }
      },
      update: {
        isEnabled: true
      },
      create: {
        userId: session.user.id,
        questionId: id,
        isEnabled: true
      }
    })

    return NextResponse.json({ message: "Successfully subscribed to question" })
  } catch (error) {
    console.error("Error subscribing to question:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 