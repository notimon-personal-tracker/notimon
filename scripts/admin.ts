#!/usr/bin/env node

import { Command } from 'commander';
import { prisma } from '../lib/prisma';
import { Topic, Question, QuestionTopic } from '../prisma/generated/prisma';

interface TopicOptions {
  name: string;
  description?: string;
}

interface QuestionOptions {
  text: string;
  options: string[];
  topics?: string[];
}

interface QuestionTopicOptions {
  questionId: string;
  topicId: string;
}

const program = new Command();

program
  .name('notimon-admin')
  .description('Admin CLI for managing Notimon topics and questions');

// Topics
program
  .command('create-topic')
  .description('Create a new topic')
  .requiredOption('-n, --name <name>', 'Topic name')
  .option('-d, --description <description>', 'Topic description')
  .action(async (options: TopicOptions) => {
    try {
      const topic: Topic = await prisma.topic.create({
        data: {
          name: options.name,
          description: options.description,
        },
      });
      console.log('Created topic:', topic);
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  });

program
  .command('list-topics')
  .description('List all topics')
  .action(async () => {
    try {
      const topics: (Topic & {
        questions: (QuestionTopic & {
          question: Question;
        })[];
      })[] = await prisma.topic.findMany({
        include: {
          questions: {
            include: {
              question: true,
            },
          },
        },
      });
      
      topics.forEach((topic) => {
        console.log(`\n${topic.name} (${topic.id})`);
        if (topic.description) console.log(`Description: ${topic.description}`);
        if (topic.questions.length > 0) {
          console.log('Questions:');
          topic.questions.forEach((qt) => {
            console.log(`- ${qt.question.text}`);
          });
        }
      });
    } catch (error) {
      console.error('Error listing topics:', error);
    }
  });

// Questions
program
  .command('create-question')
  .description('Create a new question')
  .requiredOption('-t, --text <text>', 'Question text')
  .requiredOption('-o, --options <options...>', 'Multiple choice options')
  .option('--topics <topics...>', 'Topic IDs to associate with')
  .action(async (options: QuestionOptions) => {
    try {
      const question: Question & {
        topics: (QuestionTopic & {
          topic: Topic;
        })[];
      } = await prisma.question.create({
        data: {
          text: options.text,
          options: options.options,
          topics: options.topics ? {
            create: options.topics.map((topicId: string) => ({
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
      console.log('Created question:', question);
    } catch (error) {
      console.error('Error creating question:', error);
    }
  });

program
  .command('list-questions')
  .description('List all questions')
  .action(async () => {
    try {
      const questions: (Question & {
        topics: (QuestionTopic & {
          topic: Topic;
        })[];
      })[] = await prisma.question.findMany({
        include: {
          topics: {
            include: {
              topic: true
            }
          }
        }
      });
      
      questions.forEach((question) => {
        console.log(`\n${question.text} (${question.id})`);
        console.log('Options:');
        question.options.forEach((option) => {
          console.log(`    ${option}`);
        });
        if (question.topics.length > 0) {
          console.log('Topics:', question.topics.map(qt => qt.topic.name).join(', '));
        }
      });
    } catch (error) {
      console.error('Error listing questions:', error);
    }
  });

// Associate questions with topics
program
  .command('add-question-to-topic')
  .description('Associate a question with a topic')
  .requiredOption('-q, --question-id <id>', 'Question ID')
  .requiredOption('-t, --topic-id <id>', 'Topic ID')
  .action(async (options: QuestionTopicOptions) => {
    try {
      const questionTopic: QuestionTopic & {
        question: Question;
        topic: Topic;
      } = await prisma.questionTopic.create({
        data: {
          questionId: options.questionId,
          topicId: options.topicId,
        },
        include: {
          question: true,
          topic: true,
        },
      });
      console.log(`Associated question "${questionTopic.question.text}" with topic "${questionTopic.topic.name}"`);
    } catch (error) {
      console.error('Error associating question with topic:', error);
    }
  });

program.parse(); 