"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Props {
  questionId: string
}

export default function QuestionSubscribeButton({ questionId }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  // Check if user is already subscribed to this question
  useEffect(() => {
    if (session?.user?.id) {
      checkSubscriptionStatus()
    } else {
      setIsCheckingStatus(false)
    }
  }, [session?.user?.id, questionId])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/questions/${questionId}/subscription`)
      if (response.ok) {
        const data = await response.json()
        setIsSubscribed(data.isSubscribed)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleSubscribe = async () => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (!session?.user?.id) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/questions/${questionId}/${isSubscribed ? 'unsubscribe' : 'subscribe'}`, {
        method: isSubscribed ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setIsSubscribed(!isSubscribed)
      } else {
        console.error('Error updating subscription')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isCheckingStatus) {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        isSubscribed
          ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200"
          : "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200"
      } disabled:opacity-50`}
    >
      {isLoading
        ? "Loading..."
        : isSubscribed
        ? "Unsubscribe"
        : session
        ? "Subscribe"
        : "Login to Subscribe"
      }
    </button>
  )
} 