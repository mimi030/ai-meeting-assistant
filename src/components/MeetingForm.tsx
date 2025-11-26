/**
 * Create a component for the meeting form
 */
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  topics: z.string().min(1, 'Topics are required'),
});

type FormData = z.infer<typeof formSchema>;

export default function MeetingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [agenda, setAgenda] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);

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
      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setAgenda(result.meeting.agenda);
      setMeetingId(result.meeting.id);
    } catch (error) {
      console.error('Error generating agenda:', error);
      alert('Failed to generate agenda. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 form-card rounded-lg shadow-md">
      <h2 className="text-2xl form-title">Create Meeting Agenda</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Meeting Title
          </label>
          <input
            {...register('title')}
            className="w-full p-2 border rounded-md"
            placeholder="Quarterly Planning Meeting"
          />
          {errors.title && (
            <p style={{ color: 'var(--secondary)' }} className="text-sm mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            className="w-full p-2 border rounded-md"
            rows={2}
            placeholder="Brief description of the meeting purpose"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Meeting Topics
          </label>
          <textarea
            {...register('topics')}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder="Enter meeting topics, one per line. Example:
              - Q2 Sales Review
              - Marketing Campaign Update
              - New Product Launch Timeline
              - Budget Allocation"
          />
          {errors.topics && (
            <p style={{ color: 'var(--secondary)' }} className="text-sm mt-1">
              {errors.topics.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 btn-primary rounded-md"
        >
          {isLoading ? 'Generating...' : 'Generate Agenda'}
        </button>
      </form>

      {agenda && (
        <div className="mt-8 p-4 agenda-border rounded-md">
          <h3 className="text-xl font-semibold mb-2">Generated Agenda</h3>
          <div className="generated-content">{agenda}</div>

          {meetingId && (
            <div className="mt-4">
              <a
                href={`/meetings/${meetingId}`}
                className="inline-block py-2 px-4 btn-primary"
              >
                Save & Continue
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
