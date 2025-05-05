import { prisma } from '@/lib/prisma';
import {
  createTopic,
  listTopics,
  createQuestion,
  listQuestions,
  addQuestionToTopic,
  CreateTopicInput,
  CreateQuestionInput,
  AddQuestionToTopicInput
} from '@/lib/admin';

describe('Admin Library', () => {
  // Clean up the database before each test
  beforeEach(async () => {
    await prisma.answer.deleteMany();
    await prisma.questionTopic.deleteMany();
    await prisma.question.deleteMany();
    await prisma.topic.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Topics', () => {
    it('should create a topic', async () => {
      const input: CreateTopicInput = {
        name: 'Test Topic',
        description: 'Test Description'
      };

      const topic = await createTopic(input);

      expect(topic.name).toBe(input.name);
      expect(topic.description).toBe(input.description);
      expect(topic.id).toBeDefined();
      expect(topic.isActive).toBe(true);
    });

    it('should not allow duplicate topic names', async () => {
      const input: CreateTopicInput = {
        name: 'Unique Topic',
        description: 'Test Description'
      };

      await createTopic(input);
      await expect(createTopic(input)).rejects.toThrow();
    });

    it('should list topics with their questions', async () => {
      // Create a topic
      const topicInput: CreateTopicInput = {
        name: 'Health',
        description: 'Health-related questions'
      };
      const topic = await createTopic(topicInput);

      // Create a question with the topic
      const questionInput: CreateQuestionInput = {
        text: 'How many hours did you sleep?',
        options: ['0-4', '4-6', '6-8', '8+'],
        topicIds: [topic.id]
      };
      await createQuestion(questionInput);

      // Get topics and verify
      const topics = await listTopics();
      expect(topics).toHaveLength(1);
      expect(topics[0].name).toBe('Health');
      expect(topics[0].questions).toHaveLength(1);
      expect(topics[0].questions[0].question.text).toBe('How many hours did you sleep?');
    });
  });

  describe('Questions', () => {
    it('should create a question with options', async () => {
      const input: CreateQuestionInput = {
        text: 'How are you feeling today?',
        options: ['Great', 'Good', 'Okay', 'Not Good']
      };

      const question = await createQuestion(input);

      expect(question.text).toBe(input.text);
      expect(question.options).toEqual(input.options);
      expect(question.id).toBeDefined();
      expect(question.isActive).toBe(true);
    });

    it('should create a question with associated topics', async () => {
      // Create topics first
      const topic1 = await createTopic({ name: 'Mood' });
      const topic2 = await createTopic({ name: 'Health' });

      // Create question with topics
      const input: CreateQuestionInput = {
        text: 'How are you feeling today?',
        options: ['Great', 'Good', 'Okay', 'Not Good'],
        topicIds: [topic1.id, topic2.id]
      };

      const question = await createQuestion(input);
      expect(question.topics).toHaveLength(2);
      expect(question.topics.map(qt => qt.topic.name)).toContain('Mood');
      expect(question.topics.map(qt => qt.topic.name)).toContain('Health');
    });

    it('should list questions with their topics', async () => {
      // Create a topic
      const topic = await createTopic({ name: 'Exercise' });

      // Create a question with the topic
      await createQuestion({
        text: 'Did you exercise today?',
        options: ['Yes', 'No'],
        topicIds: [topic.id]
      });

      const questions = await listQuestions();
      expect(questions).toHaveLength(1);
      expect(questions[0].text).toBe('Did you exercise today?');
      expect(questions[0].topics).toHaveLength(1);
      expect(questions[0].topics[0].topic.name).toBe('Exercise');
    });
  });

  describe('Question-Topic Associations', () => {
    it('should associate an existing question with an existing topic', async () => {
      // Create a topic
      const topic = await createTopic({ name: 'Exercise' });

      // Create a question
      const question = await createQuestion({
        text: 'Did you exercise today?',
        options: ['Yes', 'No']
      });

      // Associate question with topic
      const input: AddQuestionToTopicInput = {
        questionId: question.id,
        topicId: topic.id
      };

      const questionTopic = await addQuestionToTopic(input);
      expect(questionTopic.question.text).toBe('Did you exercise today?');
      expect(questionTopic.topic.name).toBe('Exercise');
    });

    it('should not allow duplicate question-topic associations', async () => {
      // Create a topic
      const topic = await createTopic({ name: 'Exercise' });

      // Create a question
      const question = await createQuestion({
        text: 'Did you exercise today?',
        options: ['Yes', 'No']
      });

      // Create first association
      const input: AddQuestionToTopicInput = {
        questionId: question.id,
        topicId: topic.id
      };

      await addQuestionToTopic(input);
      await expect(addQuestionToTopic(input)).rejects.toThrow();
    });
  });
}); 