import { createMeeting } from '@/lib/dynamodb';

// Mock the entire AWS SDK module
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
  },
  PutCommand: jest.fn(),
}));

describe('DynamoDB functions', () => {
  test('createMeeting saves meeting data', async () => {
    const meeting = {
      id: '123',
      title: 'Test Meeting',
      topics: 'Topic 1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    await expect(createMeeting(meeting)).resolves.toEqual(meeting);
  });
});
