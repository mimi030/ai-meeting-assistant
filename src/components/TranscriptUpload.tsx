'use client';

import { useState } from 'react';
import { validateFileName } from '@/lib/upload-validation';

interface TranscriptUploadProps {
  meetingId: string;
}

/**
 * Component for uploading transcript files to S3
 *
 * Workflow:
 * 1. User selects file
 * 2. Client-side validation (file name)
 * 3. Request presigned URL from API
 * 4. Upload file directly to S3 using presigned URL
 * 5. Confirm upload success and refresh
 */
export default function TranscriptUpload({ meetingId }: TranscriptUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file name
      const validation = validateFileName(selectedFile.name);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');
    try {
      // Get presigned URL
      const urlResponse = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, fileName: file.name }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, transcriptUrl } = await urlResponse.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Confirm successful upload
      const confirmResponse = await fetch('/api/transcript/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, transcriptUrl }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      setUploadSuccess(true);
      setFile(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error uploading transcript:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-6 p-4 card">
      <h3 className="text-lg font-medium mb-2">Upload Transcript (Optional)</h3>

      <div className="space-y-4">
        <input
          type="file"
          accept=".txt,.doc,.docx,.pdf"
          onChange={handleFileChange}
          className="block w-full text-sm"
          style={{ color: 'var(--text-muted)' }}
        />

        {error && (
          <p style={{ color: 'var(--error)' }} className="text-sm">
            ❌ {error}
          </p>
        )}

        {file && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="py-2 px-4 btn-primary"
          >
            {isUploading ? 'Uploading...' : 'Upload Transcript'}
          </button>
        )}

        {uploadSuccess && (
          <p style={{ color: 'var(--accent)' }} className="text-sm">
            ✅ Transcript uploaded successfully!
          </p>
        )}
      </div>
    </div>
  );
}
