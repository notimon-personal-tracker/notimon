import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth"
import { PrismaClient } from "../../../../../prisma/generated/prisma"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse and validate the date
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    // Get all questions the user is subscribed to
    const userQuestions = await prisma.userQuestionPreference.findMany({
      where: {
        userId: session.user.id,
        isEnabled: true,
        question: {
          isActive: true
        }
      },
      include: {
        question: {
          include: {
            topics: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    })

    // Get existing answers for this date
    const existingAnswers = await prisma.answer.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
        }
      }
    })

    // Create a map of existing answers by question ID
    const answersMap = existingAnswers.reduce((acc, answer) => {
      acc[answer.questionId] = answer.answer
      return acc
    }, {} as Record<string, string>)

    // Format the response
    const questionsWithAnswers = userQuestions.map(userQuestion => ({
      question: {
        id: userQuestion.question.id,
        text: userQuestion.question.text,
        options: userQuestion.question.options
      },
      topics: userQuestion.question.topics.map(qt => ({
        id: qt.topic.id,
        name: qt.topic.name
      })),
      currentAnswer: answersMap[userQuestion.question.id] || null
    }))

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      questions: questionsWithAnswers
    })
  } catch (error) {
    console.error("Error fetching user questions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 