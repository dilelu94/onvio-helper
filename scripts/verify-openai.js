import OpenAI from 'openai';

try {
  const openai = new OpenAI({
    apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Placeholder key
  });
  console.log('OpenAI client correctly initialized.');
  console.log('Verification successful: openai library is available and importable.');
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
  process.exit(1);
}
