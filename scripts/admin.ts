#!/usr/bin/env node

import { Command } from 'commander';
import { stdin as input, stdout as output } from 'process';
import { 
  createTopic, 
  listTopics, 
  createQuestion, 
  listQuestions, 
  addQuestionToTopic,
  resetUserPassword,
  CreateTopicInput,
  CreateQuestionInput,
  AddQuestionToTopicInput
} from '../lib/admin';

const program = new Command();

function promptHidden(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!input.isTTY) {
      reject(new Error('Interactive password prompt requires a TTY'));
      return;
    }

    let password = '';

    const cleanup = () => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
    };

    const onData = (chunk: Buffer) => {
      const value = chunk.toString('utf8');

      if (value === '\u0003') {
        output.write('\n');
        cleanup();
        reject(new Error('Password prompt cancelled'));
        return;
      }

      if (value === '\r' || value === '\n') {
        output.write('\n');
        cleanup();
        resolve(password);
        return;
      }

      if (value === '\u007f') {
        password = password.slice(0, -1);
        return;
      }

      password += value;
    };

    output.write(query);
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

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

// User management
program
  .command('reset-user-password')
  .description('Reset a user password by email')
  .requiredOption('-e, --email <email>', 'User email')
  .action(async (options: { email: string }) => {
    try {
      const newPassword = await promptHidden('Enter new password: ');
      if (!newPassword) {
        throw new Error('New password is required');
      }

      const user = await resetUserPassword({
        email: options.email,
        newPassword,
      });

      console.log(`Password reset successfully for ${user.email} (${user.id})`);
    } catch (error) {
      console.error('Error resetting user password:', error);
      process.exit(1);
    }
  });

program.parse(); 