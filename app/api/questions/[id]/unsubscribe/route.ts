import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { PrismaClient } from "../../../../../prisma/generated/prisma"

const prisma = new PrismaClient()

export async function DELETE(
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

    // Check if user has a preference for this question
    const userPreference = await prisma.userQuestionPreference.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: id
        }
      }
    })

    if (!userPreference) {
      return NextResponse.json(
        { error: "You are not subscribed to this question" },
        { status: 400 }
      )
    }

    // Unsubscribe from the question
    await prisma.userQuestionPreference.update({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: id
        }
      },
      data: {
        isEnabled: false
      }
    })

    return NextResponse.json({ message: "Successfully unsubscribed from question" })
  } catch (error) {
    console.error("Error unsubscribing from question:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 