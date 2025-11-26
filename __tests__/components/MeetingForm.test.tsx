import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeetingForm from '@/components/MeetingForm';

global.fetch = jest.fn();

describe('MeetingForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders form fields', () => {
    render(<MeetingForm />);
    expect(
      screen.getByPlaceholderText(/quarterly planning meeting/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter meeting topics/i)
    ).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ meeting: { agenda: 'Test agenda', id: '123' } }),
    });

    render(<MeetingForm />);

    await userEvent.type(
      screen.getByPlaceholderText(/quarterly planning meeting/i),
      'Test Meeting'
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter meeting topics/i),
      'Topic 1\nTopic 2'
    );

    fireEvent.click(screen.getByText(/generate agenda/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/agenda', expect.any(Object));
    });
  });
});
