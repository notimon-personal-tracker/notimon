"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Question {
  id: string
  text: string
  options: string[]
}

interface Topic {
  id: string
  name: string
}

interface QuestionWithAnswer {
  question: Question
  topics: Topic[]
  currentAnswer: string | null
}

interface DayData {
  date: string
  questions: QuestionWithAnswer[]
}

export default function QuestionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingAnswers, setSavingAnswers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchQuestionsForDate(currentDate)
    }
  }, [status, router, currentDate])

  const fetchQuestionsForDate = async (date: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/user/questions/${date}`)
      if (response.ok) {
        const data = await response.json()
        setDayData(data)
      } else {
        console.error("Failed to fetch questions")
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = async (questionId: string, answer: string) => {
    if (!dayData) return

    // Add to saving set
    setSavingAnswers(prev => new Set(prev).add(questionId))

    try {
      const response = await fetch("/api/user/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          answer,
          date: currentDate
        }),
      })

      if (response.ok) {
        // Update local state
        setDayData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            questions: prev.questions.map(q =>
              q.question.id === questionId
                ? { ...q, currentAnswer: answer }
                : q
            )
          }
        })
      } else {
        console.error("Failed to save answer")
      }
    } catch (error) {
      console.error("Error saving answer:", error)
    } finally {
      // Remove from saving set
      setSavingAnswers(prev => {
        const newSet = new Set(prev)
        newSet.delete(questionId)
        return newSet
      })
    }
  }

  const navigateDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
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
        {/* Header with date navigation */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Daily Questions
            </h1>
            <Link
              href="/account"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage Subscriptions →
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate(-1)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300"
              >
                ← Previous Day
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(currentDate)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentDate}
                </p>
              </div>
              <button
                onClick={() => navigateDate(1)}
                disabled={currentDate >= new Date().toISOString().split('T')[0]}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Day →
              </button>
            </div>
            
            {currentDate !== new Date().toISOString().split('T')[0] && (
              <button
                onClick={goToToday}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Go to Today
              </button>
            )}
          </div>
        </div>

        {/* Questions */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
          </div>
        ) : !dayData || dayData.questions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No questions available for this date.
            </p>
            <Link
              href="/topics"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Browse Question Topics
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {dayData.questions.map((questionData) => (
              <div
                key={questionData.question.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {questionData.question.text}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {questionData.topics.map((topic) => (
                      <span
                        key={topic.id}
                        className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs"
                      >
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {questionData.question.options.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        questionData.currentAnswer === option
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${questionData.question.id}`}
                        value={option}
                        checked={questionData.currentAnswer === option}
                        onChange={() => handleAnswerChange(questionData.question.id, option)}
                        disabled={savingAnswers.has(questionData.question.id)}
                        className="mr-3"
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {option}
                      </span>
                      {savingAnswers.has(questionData.question.id) && questionData.currentAnswer === option && (
                        <span className="ml-auto text-blue-600 text-sm">Saving...</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 