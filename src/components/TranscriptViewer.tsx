/**
 * Create a component for viewing meeting transcripts
 */

'use client';

import { useState, useEffect } from 'react';

interface TranscriptViewerProps {
  transcriptKey: string;
}

export default function TranscriptViewer({
  transcriptKey,
}: TranscriptViewerProps) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getViewUrl() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/transcript/view?key=${encodeURIComponent(transcriptKey)}`
        );

        if (!response.ok) {
          throw new Error('Failed to get view URL');
        }

        const data = await response.json();
        setViewUrl(data.viewUrl);
      } catch (err) {
        console.error('Error getting transcript view URL:', err);
        setError('Failed to load transcript. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    getViewUrl();
  }, [transcriptKey]);

  if (isLoading) {
    return <p>Loading transcript...</p>;
  }

  if (error) {
    return <p style={{ color: 'var(--secondary)' }}>{error}</p>;
  }

  return (
    <div>
      <a
        href={viewUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="link"
      >
        View Transcript
      </a>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
        (Link expires in 1 hour)
      </p>
    </div>
  );
}
