import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { PrismaClient } from "../../../../prisma/generated/prisma"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { questionId, answer, date } = await request.json()

    if (!questionId || !answer || !date) {
      return NextResponse.json(
        { error: "Question ID, answer, and date are required" },
        { status: 400 }
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

    // Verify the user is subscribed to this question
    const userPreference = await prisma.userQuestionPreference.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: questionId
        }
      },
      include: {
        question: true
      }
    })

    if (!userPreference || !userPreference.isEnabled) {
      return NextResponse.json(
        { error: "You are not subscribed to this question" },
        { status: 400 }
      )
    }

    // Verify the answer is one of the valid options
    if (!userPreference.question.options.includes(answer)) {
      return NextResponse.json(
        { error: "Invalid answer option" },
        { status: 400 }
      )
    }

    // Check if an answer already exists for this date
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)

    const existingAnswer = await prisma.answer.findFirst({
      where: {
        userId: session.user.id,
        questionId: questionId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    if (existingAnswer) {
      // Update existing answer
      await prisma.answer.update({
        where: {
          id: existingAnswer.id
        },
        data: {
          answer: answer
        }
      })
    } else {
      // Create new answer with the target date
      await prisma.answer.create({
        data: {
          userId: session.user.id,
          questionId: questionId,
          answer: answer,
          createdAt: startOfDay
        }
      })
    }

    return NextResponse.json({ message: "Answer saved successfully" })
  } catch (error) {
    console.error("Error saving answer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 