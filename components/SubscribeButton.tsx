"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Props {
  topicId: string
}

export default function SubscribeButton({ topicId }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already subscribed to this topic
  useEffect(() => {
    if (session?.user?.id) {
      checkSubscriptionStatus()
    }
  }, [session?.user?.id, topicId])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/topics/${topicId}/subscription`)
      if (response.ok) {
        const data = await response.json()
        setIsSubscribed(data.isSubscribed)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
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
      const response = await fetch(`/api/topics/${topicId}/subscribe`, {
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

  if (status === "loading") {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 px-6 py-2 rounded-lg">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
        isSubscribed
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      } disabled:opacity-50`}
    >
      {isLoading
        ? "Loading..."
        : isSubscribed
        ? "Unsubscribe"
        : session
        ? "Subscribe to Questions"
        : "Login to Subscribe"
      }
    </button>
  )
} 