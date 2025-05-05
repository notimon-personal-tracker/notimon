#!/usr/bin/env node

import { Command } from 'commander';
import { 
  createTopic, 
  listTopics, 
  createQuestion, 
  listQuestions, 
  addQuestionToTopic,
  CreateTopicInput,
  CreateQuestionInput,
  AddQuestionToTopicInput
} from '../lib/admin';

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
  .action(async (options: CreateTopicInput) => {
    try {
      const topic = await createTopic(options);
      console.log('Created topic:', topic);
    } catch (error) {
      console.error('Error creating topic:', error);
      process.exit(1);
    }
  });

program
  .command('list-topics')
  .description('List all topics')
  .action(async () => {
    try {
      const topics = await listTopics();
      
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
      process.exit(1);
    }
  });

// Questions
program
  .command('create-question')
  .description('Create a new question')
  .requiredOption('-t, --text <text>', 'Question text')
  .requiredOption('-o, --options <options...>', 'Multiple choice options')
  .option('--topics <topics...>', 'Topic IDs to associate with')
  .action(async (options) => {
    try {
      const input: CreateQuestionInput = {
        text: options.text,
        options: options.options,
        topicIds: options.topics
      };
      const question = await createQuestion(input);
      console.log('Created question:', question);
    } catch (error) {
      console.error('Error creating question:', error);
      process.exit(1);
    }
  });

program
  .command('list-questions')
  .description('List all questions')
  .action(async () => {
    try {
      const questions = await listQuestions();
      
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
      process.exit(1);
    }
  });

// Associate questions with topics
program
  .command('add-question-to-topic')
  .description('Associate a question with a topic')
  .requiredOption('-q, --question-id <id>', 'Question ID')
  .requiredOption('-t, --topic-id <id>', 'Topic ID')
  .action(async (options: AddQuestionToTopicInput) => {
    try {
      const questionTopic = await addQuestionToTopic(options);
      console.log(`Associated question "${questionTopic.question.text}" with topic "${questionTopic.topic.name}"`);
    } catch (error) {
      console.error('Error associating question with topic:', error);
      process.exit(1);
    }
  });

program.parse(); 