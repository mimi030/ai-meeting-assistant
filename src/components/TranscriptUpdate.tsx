/**
 * Component for updating an existing transcript
 */
'use client';

import { useState } from 'react';

interface TranscriptUpdateProps {
  meetingId: string;
  currentTranscriptKey: string;
}

export default function TranscriptUpdate({
  meetingId,
  currentTranscriptKey,
}: TranscriptUpdateProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Get presigned URL
      const urlResponse = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          fileName: file.name,
          replaceKey: currentTranscriptKey,
        }),
      });

      const { uploadUrl } = await urlResponse.json();
      if (!urlResponse.ok) throw new Error('Failed to get upload URL');

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      setUploadSuccess(true);
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error uploading transcript:', error);
      alert('Failed to upload transcript. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-6 p-4 card">
      <h3 className="text-lg font-medium mb-2">Update Transcript</h3>

      <div className="space-y-4">
        <input
          type="file"
          accept=".txt,.doc,.docx,.pdf"
          onChange={handleFileChange}
          className="block w-full text-sm"
          style={{ color: 'var(--text-muted)' }}
        />

        {file && (
          <button
            onClick={handleUpload}
            disabled={isUploading || uploadSuccess}
            className="py-2 px-4 btn-primary"
          >
            {isUploading
              ? 'Uploading...'
              : uploadSuccess
              ? 'Uploaded Successfully!'
              : 'Update Transcript'}
          </button>
        )}
      </div>
    </div>
  );
}
