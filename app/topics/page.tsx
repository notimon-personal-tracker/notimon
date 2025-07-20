import Link from "next/link"
import { PrismaClient } from "../../prisma/generated/prisma"

const prisma = new PrismaClient()

export default async function TopicsPage() {
  const topics = await prisma.topic.findMany({
    where: {
      isActive: true
    },
    include: {
      questions: {
        where: {
          question: {
            isActive: true
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Question Topics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose topics you'd like to track with daily questions
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No topics available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {topic.name}
                </h2>
                {topic.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {topic.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {topic.questions.length} question{topic.questions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View questions →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 