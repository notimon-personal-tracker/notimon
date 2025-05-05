#!/usr/bin/env node

import { sendDailyQuestions } from '../lib/sendDailyQuestions';

// Run the script
sendDailyQuestions()
  .then(() => {
    console.log('Successfully sent daily questions');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error sending daily questions:', error);
    process.exit(1);
  }); 