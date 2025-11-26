/**
 * This page is for creating a new meeting
 */
import Link from 'next/link';
import MeetingForm from '@/components/MeetingForm';

export default function NewMeetingPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/meetings" className="link">
            ← Back to all meetings
          </Link>
        </div>

        <MeetingForm />
      </div>
    </div>
  );
}
