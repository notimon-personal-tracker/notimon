-- CreateTable
CREATE TABLE "DailyQuestionSequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestionSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionSequence_userId_questionId_date_key" ON "DailyQuestionSequence"("userId", "questionId", "date");

-- AddForeignKey
ALTER TABLE "DailyQuestionSequence" ADD CONSTRAINT "DailyQuestionSequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuestionSequence" ADD CONSTRAINT "DailyQuestionSequence_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
