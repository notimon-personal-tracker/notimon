"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export default function Navigation() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return null
  }

  return (
    <nav className="fixed top-0 right-0 p-4">
      <div className="flex items-center gap-6">
        <Link
          href="/topics"
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
        >
          Topics
        </Link>
        
        {session && (
          <Link
            href="/questions"
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
          >
            Questions
          </Link>
        )}
        
        {session ? (
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              My Account ({session.user.email})
            </Link>
            <button
              onClick={() => signOut()}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
} 