/**
 * Component for updating existing meeting notes
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

interface NotesUpdateProps {
  meetingId: string;
  existingNotes: string;
}

export default function NotesUpdate({
  meetingId,
  existingNotes,
}: NotesUpdateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: existingNotes,
    },
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

      setSuccess(true);
      // Reload the page after a short delay to show the updated content
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 card mt-8">
      <h2 className="text-2xl font-bold mb-6">Update Meeting Notes</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Meeting Notes
          </label>
          <textarea
            {...register('notes')}
            className="w-full p-2 border rounded-md"
            rows={8}
          />
          {errors.notes && (
            <p style={{ color: 'var(--secondary)' }} className="text-sm mt-1">
              {errors.notes.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full py-2 px-4 btn-primary"
        >
          {isLoading
            ? 'Updating...'
            : success
            ? 'Updated Successfully!'
            : 'Update Notes & Summary'}
        </button>
      </form>
    </div>
  );
}
