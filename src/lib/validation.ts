import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  topics: z.string().min(1, 'Topics are required'),
});

export const uploadTranscriptSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
  fileName: z.string().min(1, 'File name is required'),
  replaceKey: z.string().optional(),
});

export const notesSchema = z.object({
  meetingId: z.string().uuid('Invalid meeting ID'),
  notes: z.string().min(1, 'Notes are required').max(10000, 'Notes too long'),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UploadTranscriptInput = z.infer<typeof uploadTranscriptSchema>;
export type NotesInput = z.infer<typeof notesSchema>;
