/**
 * API route for generating meeting agendas
 *
 * POST /api/agenda
 * Request body: { title?: string, description?: string, topics: string }
 * Response: { meeting: { id, title, description, topics, agenda, createdAt, updatedAt } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAgenda } from '@/lib/openai';
import { createMeeting } from '@/lib/dynamodb';
import { v4 as uuidv4 } from 'uuid';

/** Validation schema for agenda request payload */
const agendaSchema = z.object({
  title: z.string().min(1).max(200).optional().default('Untitled Meeting'),
  description: z.string().max(1000).optional().default(''),
  topics: z.string().min(1, 'Topics are required').max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    let requestData;

    // Parse JSON body - catch malformed JSON early
    try {
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request data against schema
    try {
      requestData = agendaSchema.parse(requestData);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        {
          error:
            'Invalid input: check title (1-200 chars), description (max 1000 chars), topics (1-5000 chars)',
        },
        { status: 400 }
      );
    }

    const {
      title = 'Untitled Meeting',
      description = '',
      topics,
    } = requestData;

    if (!topics) {
      return NextResponse.json(
        { error: 'Topics are required' },
        { status: 400 }
      );
    }

    // Fallback to default agenda if OpenAI fails
    let agenda;
    try {
      agenda = await generateAgenda(topics);
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);

      agenda = `
        # Meeting Agenda (OpenAI API Error)

        ## Topics:
        ${topics
          .split('\n')
          .map((topic: string) => `- ${topic.trim()} (15 minutes)`)
          .join('\n')}

        ## Additional Items:
        - Welcome and Introduction (5 minutes)
        - Open Discussion (10 minutes)
        - Action Items and Next Steps (5 minutes)

        Total Estimated Time: ${topics.split('\n').length * 15 + 20} minutes
      `;
    }

    const meetingId = uuidv4();
    const now = new Date().toISOString();
    const meetingData = {
      id: meetingId,
      title,
      description,
      topics,
      agenda,
      status: 'in_progress' as const,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const meeting = await createMeeting(meetingData);
      return NextResponse.json({ meeting });
    } catch (dbError) {
      // If DynamoDB fails, still return the meeting data
      console.error('Error saving to DynamoDB:', dbError);
      return NextResponse.json({
        meeting: meetingData,
        warning: 'Meeting was generated but could not be saved to database',
      });
    }
  } catch (error) {
    console.error('Unhandled error in agenda API route:', error);

    // Create a default response for any unhandled error
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
