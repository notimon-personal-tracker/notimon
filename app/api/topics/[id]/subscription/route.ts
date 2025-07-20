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

    // Get all questions for this topic
    const topicQuestions = await prisma.questionTopic.findMany({
      where: {
        topicId: id,
        question: {
          isActive: true
        }
      },
      select: {
        questionId: true
      }
    })

    if (topicQuestions.length === 0) {
      return NextResponse.json({ isSubscribed: false })
    }

    // Check if user has preferences for all questions in this topic
    const userPreferences = await prisma.userQuestionPreference.findMany({
      where: {
        userId: session.user.id,
        questionId: {
          in: topicQuestions.map(tq => tq.questionId)
        },
        isEnabled: true
      }
    })

    // User is considered subscribed if they have preferences for all questions in the topic
    const isSubscribed = userPreferences.length === topicQuestions.length

    return NextResponse.json({ isSubscribed })
  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 