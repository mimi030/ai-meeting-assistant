import { NextRequest, NextResponse } from 'next/server';
import { updateMeeting } from '@/lib/dynamodb';

export async function POST(req: NextRequest) {
  try {
    const { meetingId, transcriptUrl } = await req.json();

    if (!meetingId || !transcriptUrl) {
      return NextResponse.json(
        { error: 'Meeting ID and transcript URL are required' },
        { status: 400 }
      );
    }

    await updateMeeting(meetingId, { transcriptUrl });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming transcript upload:', error);
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    );
  }
}
