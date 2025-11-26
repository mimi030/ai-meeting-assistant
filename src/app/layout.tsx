import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'AI Meeting Assistant',
  description: 'Generate meeting agendas and summaries with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <nav className="navbar shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0">
                  <Link href="/" className="nav-brand text-xl">
                    AI Meeting Assistant
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <Link
                      href="/"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      Home
                    </Link>

                    <Link
                      href="/meetings"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      Meetings
                    </Link>

                    <Link
                      href="/meetings/new"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      New Meeting
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          {children}
          <footer
            className="border-t mt-12"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div
              className="max-w-7xl mx-auto px-4 py-6 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              &copy; {new Date().getFullYear()} AI Meeting Assistant. All rights
              reserved.
            </div>
          </footer>
        </ErrorBoundary>
      </body>
    </html>
  );
}
