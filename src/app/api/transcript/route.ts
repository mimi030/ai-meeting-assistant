import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/s3';
import { getMeeting } from '@/lib/dynamodb';
import { validateFileName } from '@/lib/upload-validation';

export async function POST(req: NextRequest) {
  try {
    const { meetingId, fileName, replaceKey } = await req.json();

    if (!meetingId || !fileName) {
      return NextResponse.json(
        { error: 'Meeting ID and file name are required' },
        { status: 400 }
      );
    }

    // Validate file name
    const fileNameValidation = validateFileName(fileName);
    if (!fileNameValidation.valid) {
      return NextResponse.json(
        { error: fileNameValidation.error },
        { status: 400 }
      );
    }

    const meeting = await getMeeting(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Use the same key if replacing, otherwise create a new one
    const key = replaceKey || `transcripts/${meetingId}/${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(key);
    const transcriptUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ uploadUrl, transcriptUrl });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
