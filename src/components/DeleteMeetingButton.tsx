'use client';

import { useState } from 'react';

export default function DeleteMeetingButton({
  meetingId,
}: {
  meetingId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent multiple clicks

    if (!confirm('Are you sure you want to delete this meeting?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      window.location.href = '/meetings';
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete meeting');
      setIsDeleting(false); // Re-enable button on error
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="py-1 px-3 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete Meeting'}
    </button>
  );
}
