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

    // Verify topic exists and is active
    const topic = await prisma.topic.findUnique({
      where: {
        id: id,
        isActive: true
      }
    })

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: "No active questions found for this topic" },
        { status: 400 }
      )
    }

    // Subscribe to all questions in the topic
    const questionIds = topicQuestions.map(tq => tq.questionId)
    
    await Promise.all(
      questionIds.map(questionId =>
        prisma.userQuestionPreference.upsert({
          where: {
            userId_questionId: {
              userId: session.user.id,
              questionId: questionId
            }
          },
          update: {
            isEnabled: true
          },
          create: {
            userId: session.user.id,
            questionId: questionId,
            isEnabled: true
          }
        })
      )
    )

    return NextResponse.json({ message: "Successfully subscribed to topic" })
  } catch (error) {
    console.error("Error subscribing to topic:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    // Unsubscribe from all questions in the topic
    const questionIds = topicQuestions.map(tq => tq.questionId)
    
    await prisma.userQuestionPreference.updateMany({
      where: {
        userId: session.user.id,
        questionId: {
          in: questionIds
        }
      },
      data: {
        isEnabled: false
      }
    })

    return NextResponse.json({ message: "Successfully unsubscribed from topic" })
  } catch (error) {
    console.error("Error unsubscribing from topic:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 