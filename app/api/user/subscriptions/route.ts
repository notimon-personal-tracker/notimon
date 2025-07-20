import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { PrismaClient } from "../../../../prisma/generated/prisma"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get all questions the user is subscribed to
    const userPreferences = await prisma.userQuestionPreference.findMany({
      where: {
        userId: session.user.id,
        isEnabled: true
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

    // Transform the data to match the expected format
    const questions = userPreferences.map(pref => ({
      question: {
        id: pref.question.id,
        text: pref.question.text,
        options: pref.question.options
      },
      questionTopic: pref.question.topics.map(qt => ({
        topic: {
          id: qt.topic.id,
          name: qt.topic.name,
          description: qt.topic.description
        }
      }))
    }))

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching user subscriptions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 