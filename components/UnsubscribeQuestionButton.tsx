"use client"

import { useState } from "react"

interface Props {
  questionId: string
  onUnsubscribe: () => void
}

export default function UnsubscribeQuestionButton({ questionId, onUnsubscribe }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleUnsubscribe = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/questions/${questionId}/unsubscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        onUnsubscribe()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to unsubscribe")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleUnsubscribe}
        disabled={isLoading}
        className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Unsubscribing..." : "Unsubscribe"}
      </button>
      {error && (
        <span className="text-red-500 text-xs mt-1">
          {error}
        </span>
      )}
    </div>
  )
} 