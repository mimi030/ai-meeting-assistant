import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold mb-6">AI Meeting Assistant</h1>
        <p className="text-xl mb-8">
          Generate structured meeting agendas, capture notes, and automatically
          create summaries with action items.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/meetings/new"
            className="py-3 px-6 btn-primary text-lg font-medium"
          >
            Create New Meeting
          </Link>

          <Link
            href="/meetings"
            className="py-3 px-6 btn-secondary text-lg font-medium"
          >
            View Past Meetings
          </Link>
        </div>
      </div>
    </div>
  );
}
