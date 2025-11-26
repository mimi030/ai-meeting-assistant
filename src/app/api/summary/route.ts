/**
 * Create API route for generating meeting summaries
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/openai';
import { getMeeting, updateMeeting } from '@/lib/dynamodb';

export async function POST(req: NextRequest) {
  try {
    const { meetingId, notes } = await req.json();

    if (!meetingId || !notes) {
      return NextResponse.json(
        { error: 'Meeting ID and notes are required' },
        { status: 400 }
      );
    }

    const meeting = await getMeeting(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const summary = await generateSummary(notes);

    // Handle case where summary might be null
    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary from OpenAI' },
        { status: 500 }
      );
    }

    // Extract action items from the summary
    const actionItemsRegex = /Action Items:([\s\S]*?)(?=\n\n|$)/;
    const match = summary.match(actionItemsRegex);
    const actionItems = match ? match[1].trim() : '';

    const updatedMeeting = await updateMeeting(meetingId, {
      notes,
      summary,
      actionItems,
    });

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
