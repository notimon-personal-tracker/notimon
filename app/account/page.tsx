"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import UnsubscribeQuestionButton from "../../components/UnsubscribeQuestionButton"
import PushNotificationToggle from "../../components/PushNotificationToggle"

interface Question {
  id: string
  text: string
  options: string[]
}

interface Topic {
  id: string
  name: string
  description?: string
}

interface SubscribedQuestion {
  question: Question
  questionTopic: {
    topic: Topic
  }[]
}

export default function Account() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscribedQuestions, setSubscribedQuestions] = useState<SubscribedQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchSubscribedQuestions()
    }
  }, [status, router])

  const fetchSubscribedQuestions = async () => {
    try {
      const response = await fetch("/api/user/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscribedQuestions(data.questions)
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionUnsubscribe = (questionId: string) => {
    // Remove the question from the local state
    setSubscribedQuestions(prevQuestions => 
      prevQuestions.filter(sq => sq.question.id !== questionId)
    )
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              My Account
            </h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-gray-900 dark:text-gray-100">
                  {session.user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-gray-900 dark:text-gray-100">
                  {session.user.name || "No name set"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Push Notification Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
          <div className="px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Notification Settings
            </h2>
            <PushNotificationToggle />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                My Subscribed Questions
              </h2>
              <Link
                href="/topics"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Browse Topics →
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">Loading subscriptions...</div>
              </div>
            ) : subscribedQuestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't subscribed to any questions yet.
                </p>
                <Link
                  href="/topics"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Browse Question Topics
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {subscribedQuestions.map((subscribedQuestion) => (
                  <div
                    key={subscribedQuestion.question.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {subscribedQuestion.question.text}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {subscribedQuestion.question.options.map((option, index) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                              >
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Topics this question belongs to */}
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Topics: 
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {subscribedQuestion.questionTopic.map((qt, index) => (
                              <Link
                                key={qt.topic.id}
                                href={`/topics/${qt.topic.id}`}
                                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded text-sm transition-colors"
                              >
                                {qt.topic.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        <UnsubscribeQuestionButton
                          questionId={subscribedQuestion.question.id}
                          onUnsubscribe={() => handleQuestionUnsubscribe(subscribedQuestion.question.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 