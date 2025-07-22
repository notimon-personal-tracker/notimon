import { notFound } from "next/navigation"
import SubscribeButton from "../../../components/SubscribeButton"
import QuestionSubscribeButton from "../../../components/QuestionSubscribeButton"
import { getPrisma } from "../../../lib/prisma"

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>
}

export default async function TopicPage({ params }: Props) {
  const { id } = await params
  const prisma = getPrisma();
  const topic = await prisma.topic.findUnique({
    where: {
      id: id,
      isActive: true
    },
    include: {
      questions: {
        where: {
          question: {
            isActive: true
          }
        },
        include: {
          question: true
        },
        orderBy: {
          question: {
            text: 'asc'
          }
        }
      }
    }
  })

  if (!topic) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              {topic.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {topic.questions.length} question{topic.questions.length !== 1 ? 's' : ''}
            </span>
            <SubscribeButton topicId={topic.id} />
          </div>
        </div>

        {topic.questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No questions available for this topic yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {topic.questions.map((questionTopic) => (
              <div
                key={questionTopic.question.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
                    {questionTopic.question.text}
                  </h3>
                  <div className="ml-4 flex-shrink-0">
                    <QuestionSubscribeButton questionId={questionTopic.question.id} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Answer options:
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {questionTopic.question.options.map((option, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 