-- DropForeignKey
ALTER TABLE "QuestionTopic" DROP CONSTRAINT "QuestionTopic_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionTopic" DROP CONSTRAINT "QuestionTopic_topicId_fkey";

-- AddForeignKey
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTopic" ADD CONSTRAINT "QuestionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
