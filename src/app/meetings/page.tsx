/**
 * This page is for listing all meetings
 */
import Link from 'next/link';
import { listMeetings } from '@/lib/dynamodb';

export const dynamic = 'force-dynamic';

export default async function MeetingsPage() {
  const meetings = await listMeetings();

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Meetings</h1>
          <Link href="/meetings/new" className="btn-primary">
            New Meeting
          </Link>
        </div>

        {meetings.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="mb-4">You don&apos;t have any meetings yet.</p>
            <Link href="/meetings/new" className="btn-primary">
              Create Your First Meeting
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="card p-4 block hover:shadow-lg transition-shadow h-full"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{meeting.title}</h2>
                  <div className="ml-2 flex-shrink-0">
                    {meeting.notes ? (
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--secondary)',
                          color: 'white',
                          opacity: 0.9,
                        }}
                      >
                        Complete
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          opacity: 0.9,
                        }}
                      >
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {meeting.description && (
                  <p className="mt-2 line-clamp-2">{meeting.description}</p>
                )}

                <div className="mt-4 flex justify-between items-end">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Created: {new Date(meeting.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
