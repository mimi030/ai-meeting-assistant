import { createMeeting } from '@/lib/dynamodb';

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.DYNAMODB_TABLE_NAME = 'test-table';

// Mock @aws-sdk/client-dynamodb
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  ConditionalCheckFailedException: class extends Error {},
}));

// Mock @aws-sdk/lib-dynamodb
const mockSend = jest.fn().mockResolvedValue({});
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend,
    })),
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  QueryCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
}));

describe('DynamoDB functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createMeeting saves meeting data', async () => {
    const meeting = {
      id: '123',
      title: 'Test Meeting',
      topics: 'Topic 1',
      status: 'in_progress' as const,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    const result = await createMeeting(meeting);
    expect(result).toEqual(meeting);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});