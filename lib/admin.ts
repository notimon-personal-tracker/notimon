import { getPrisma } from './prisma';
import { Topic, Question, QuestionTopic } from '../prisma/generated/prisma';
import bcryptjs from 'bcryptjs';

export interface CreateTopicInput {
  name: string;
  description?: string;
}

export interface CreateQuestionInput {
  text: string;
  options: string[];
  topicIds?: string[];
}

export interface AddQuestionToTopicInput {
  questionId: string;
  topicId: string;
}

export interface ResetUserPasswordInput {
  email: string;
  newPassword: string;
}

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const prisma = getPrisma();
  return await prisma.topic.create({
    data: {
      name: input.name,
      description: input.description,
    },
  });
}

export async function listTopics(): Promise<(Topic & {
  questions: (QuestionTopic & {
    question: Question;
  })[];
})[]> {
  const prisma = getPrisma();
  return await prisma.topic.findMany({
    include: {
      questions: {
        include: {
          question: true,
        },
      },
    },
  });
}

export async function createQuestion(input: CreateQuestionInput): Promise<Question & {
  topics: (QuestionTopic & {
    topic: Topic;
  })[];
}> {
  const prisma = getPrisma();
  return await prisma.question.create({
    data: {
      text: input.text,
      options: input.options,
      topics: input.topicIds ? {
        create: input.topicIds.map(topicId => ({
          topic: {
            connect: { id: topicId }
          }
        }))
      } : undefined
    },
    include: {
      topics: {
        include: {
          topic: true
        }
      }
    }
  });
}

export async function listQuestions(): Promise<(Question & {
  topics: (QuestionTopic & {
    topic: Topic;
  })[];
})[]> {
  const prisma = getPrisma();
  return await prisma.question.findMany({
    include: {
      topics: {
        include: {
          topic: true
        }
      }
    }
  });
}

export async function addQuestionToTopic(input: AddQuestionToTopicInput): Promise<QuestionTopic & {
  question: Question;
  topic: Topic;
}> {
  const prisma = getPrisma();
  return await prisma.questionTopic.create({
    data: {
      questionId: input.questionId,
      topicId: input.topicId,
    },
    include: {
      question: true,
      topic: true,
    },
  });
} 

export async function resetUserPassword(input: ResetUserPasswordInput): Promise<{
  id: string;
  email: string;
  updatedAt: Date;
}> {
  if (!input.email) {
    throw new Error('Email is required');
  }

  if (!input.newPassword) {
    throw new Error('New password is required');
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error(`User with email "${input.email}" was not found`);
  }

  const hashedPassword = await bcryptjs.hash(input.newPassword, 12);

  return await prisma.user.update({
    where: {
      email: input.email,
    },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      updatedAt: true,
    },
  });
}