/**
 * Create a component for uploading meeting notes
 */
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  notes: z.string().min(1, 'Meeting notes are required'),
});

type FormData = z.infer<typeof formSchema>;

interface NotesUploadProps {
  meetingId: string;
}

export default function NotesUpload({ meetingId }: NotesUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, notes: data.notes }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSummary(result.meeting.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto p-6 card">
      <h2 className="text-2xl font-bold mb-6">Upload Meeting Notes</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Meeting Notes
          </label>
          <textarea
            {...register('notes')}
            className="w-full p-2 border rounded-md"
            rows={8}
            placeholder="Paste your meeting notes or transcript here..."
          />
          {errors.notes && (
            <p style={{ color: 'var(--secondary)' }} className="text-sm mt-1">
              {errors.notes.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 btn-primary"
        >
          {isLoading ? 'Generating Summary...' : 'Generate Summary'}
        </button>
      </form>

      {summary && (
        <div className="mt-8 p-4 border rounded-md">
          <h3 className="text-xl font-semibold mb-2">Meeting Summary</h3>
          <div className="whitespace-pre-wrap">{summary}</div>
        </div>
      )}
    </div>
  );
}
