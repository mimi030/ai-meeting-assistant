/**
 * This file is for viewing a specific meeting's details
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMeeting } from '@/lib/dynamodb';
import NotesUpload from '@/components/NotesUpload';
import NotesUpdate from '@/components/NotesUpdate';
import TranscriptUpload from '@/components/TranscriptUpload';
import TranscriptUpdate from '@/components/TranscriptUpdate';
import TranscriptViewer from '@/components/TranscriptViewer';
import DeleteMeetingButton from '@/components/DeleteMeetingButton';

interface MeetingPageProps {
  params: {
    id: string;
  };
}

// Not to prerender this page at build time
export const dynamic = 'force-dynamic';

export default async function MeetingPage({ params }: MeetingPageProps) {
  const meeting = await getMeeting(params.id);

  if (!meeting) {
    notFound();
  }

  // Extract the key from the transcriptUrl if it exists
  let transcriptKey = null;
  if (meeting.transcriptUrl) {
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;
    if (meeting.transcriptUrl.startsWith(prefix)) {
      transcriptKey = meeting.transcriptUrl.substring(prefix.length);
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/meetings" className="link">
            ← Back to all meetings
          </Link>
          <DeleteMeetingButton meetingId={meeting.id} />
        </div>

        <div className="meeting-panel mb-8">
          <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>
          {meeting.description && <p className="mb-4">{meeting.description}</p>}

          <div
            className="border-t pt-4 mt-4"
            style={{ borderColor: 'rgba(218, 165, 32, 0.5)' }}
          >
            <h2 className="text-xl font-semibold mb-2">Agenda</h2>
            <div className="generated-content">{meeting.agenda}</div>
          </div>

          {transcriptKey && (
            <div
              className="mt-6 pt-6 border-t"
              style={{ borderColor: 'rgba(218, 165, 32, 0.5)' }}
            >
              <h3 className="text-lg font-semibold mb-2">Transcript</h3>
              <TranscriptViewer transcriptKey={transcriptKey} />

              {/* Add button to toggle transcript update form */}
              <details className="mt-4">
                <summary>Update Transcript</summary>
                <div className="mt-2">
                  <TranscriptUpdate
                    meetingId={meeting.id}
                    currentTranscriptKey={transcriptKey}
                  />
                </div>
              </details>
            </div>
          )}
        </div>

        {!meeting.notes ? (
          <>
            <NotesUpload meetingId={meeting.id} />
            {!meeting.transcriptUrl && (
              <TranscriptUpload meetingId={meeting.id} />
            )}
          </>
        ) : (
          <>
            <div className="meeting-panel">
              <h2 className="text-xl font-semibold mb-4">Meeting Summary</h2>
              <div className="generated-content mb-6">{meeting.summary}</div>

              <h3 className="text-lg font-semibold mb-2">Action Items</h3>
              <div className="generated-content">{meeting.actionItems}</div>

              {/* Add button to toggle notes update form */}
              <details
                className="mt-6 pt-6 border-t"
                style={{ borderColor: 'rgba(218, 165, 32, 0.5)' }}
              >
                <summary>Update Notes & Summary</summary>
                <div className="mt-2">
                  <NotesUpdate
                    meetingId={meeting.id}
                    existingNotes={meeting.notes}
                  />
                </div>
              </details>
            </div>

            {/* Show transcript upload if no transcript exists yet */}
            {!meeting.transcriptUrl && (
              <div className="mt-8">
                <TranscriptUpload meetingId={meeting.id} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
