/**
 * Create API Routes for OpenAI Integration
 */
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // This is a server-side only client
});

// Simple in-memory cache
const cache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function generateAgenda(topics: string) {
  // Check cache first
  const cacheKey = `agenda:${topics}`;
  const cachedResult = cache.get(cacheKey);

  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    console.log('Using cached agenda');
    return cachedResult.content;
  }

  try {
    console.log('Initializing OpenAI API call with model: gpt-3.5-turbo');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert meeting facilitator. Create a structured meeting agenda with time estimates based on the provided topics.',
        },
        {
          role: 'user',
          content: `Create a meeting agenda with time estimates for the following topics: ${topics}`,
        },
      ],
      temperature: 0.7,
    });

    console.log(
      'OpenAI API response received with status:',
      completion.choices.length > 0 ? 'success' : 'no choices'
    );
    const content = completion.choices[0]?.message.content || '';

    // Cache the result
    cache.set(cacheKey, { content, timestamp: Date.now() });

    return content;
  } catch (error) {
    console.error('OpenAI API error details:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Return a default agenda instead of throwing
    const defaultAgenda = `
        # Meeting Agenda

        ## Topics:
        ${topics
          .split('\n')
          .map((topic) => `- ${topic.trim()} (15 minutes)`)
          .join('\n')}

        ## Additional Items:
        - Welcome and Introduction (5 minutes)
        - Open Discussion (10 minutes)
        - Action Items and Next Steps (5 minutes)

        Total Estimated Time: ${topics.split('\n').length * 15 + 20} minutes
    `;

    return defaultAgenda;
  }
}

export async function generateSummary(notes: string) {
  // For summaries, we use a hash of the notes as the cache key
  // since notes might be too long for a key
  const cacheKey = `summary:${hashString(notes)}`;
  const cachedResult = cache.get(cacheKey);

  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    console.log('Using cached summary');
    return cachedResult.content;
  }

  try {
    console.log('Calling OpenAI API for summary generation...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert meeting summarizer. Extract key decisions and action items from meeting notes.',
        },
        {
          role: 'user',
          content: `Summarize the key decisions and action items from these meeting notes: ${notes}`,
        },
      ],
      temperature: 0.7,
    });

    console.log('OpenAI API response received');
    const content = completion.choices[0].message.content || '';

    // Cache the result
    cache.set(cacheKey, { content, timestamp: Date.now() });

    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);

    // Return a basic summary instead of throwing
    const defaultSummary = `
        # Meeting Summary

        ## Key Points:
        - Meeting notes processed
        - Summary generation failed due to technical issues

        ## Action Items:
        - Review the original notes manually
        - Try summarizing again later
    `;

    return defaultSummary;
  }
}

// Simple string hashing function
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}
