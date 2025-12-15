/**
 * This file is a DynamoDB utility file for the AI Meeting Tool.
 * It contains functions to interact with DynamoDB, including creating a table,
 * inserting items, and querying items.
 */
import {
  DynamoDBClient,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

// Lazy initialization of DynamoDB client
let client: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

function getDynamoDBClient(): DynamoDBClient {
  if (!client) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Validate credentials
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing AWS credentials. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.'
      );
    }

    client = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        // Only include sessionToken if it's provided and not empty
        ...(process.env.AWS_SESSION_TOKEN &&
        process.env.AWS_SESSION_TOKEN.trim() !== ''
          ? { sessionToken: process.env.AWS_SESSION_TOKEN }
          : {}),
      },
      maxAttempts: 3,
      retryMode: 'adaptive',
    });
  }
  return client;
}

function getDynamoDBDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(getDynamoDBClient());
  }
  return docClient;
}

export const TableName = process.env.DYNAMODB_TABLE_NAME || 'ai_meeting_tool';

// Meeting type definition
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  topics: string;
  agenda?: string;
  notes?: string;
  summary?: string;
  actionItems?: string;
  transcriptUrl?: string;
  status: 'in_progress' | 'complete';
  createdAt: string;
  updatedAt: string;
}

// Create a new meeting
export async function createMeeting(meeting: Meeting) {
  try {
    if (!TableName) {
      throw new Error('DynamoDB table name is not defined');
    }

    const meetingWithStatus = {
      ...meeting,
      status: meeting.status || 'in_progress',
    };

    const command = new PutCommand({
      TableName,
      Item: meetingWithStatus,
    });

    await getDynamoDBDocClient().send(command);
    return meetingWithStatus;
  } catch (error) {
    console.error('Error creating meeting in DynamoDB:', error);
    throw error;
  }
}

// Get a meeting by ID
export async function getMeeting(id: string) {
  try {
    const command = new GetCommand({
      TableName,
      Key: { id },
    });

    const response = await getDynamoDBDocClient().send(command);
    return response.Item as Meeting | undefined;
  } catch (error) {
    console.error('Error getting meeting from DynamoDB:', error);
    throw error;
  }
}

// List all meetings with pagination
export async function listMeetings(
  limit: number = 20,
  paginationState?: {
    inProgressKey?: Record<string, unknown>;
    completeKey?: Record<string, unknown>;
  }
) {
  try {
    const queryLimit = Math.ceil(limit / 2);

    const inProgressCommand = new QueryCommand({
      TableName,
      IndexName: 'status-createdAt-index',
      Limit: queryLimit,
      ExclusiveStartKey: paginationState?.inProgressKey,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'in_progress' },
      ScanIndexForward: false,
    });

    const completeCommand = new QueryCommand({
      TableName,
      IndexName: 'status-createdAt-index',
      Limit: queryLimit,
      ExclusiveStartKey: paginationState?.completeKey,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'complete' },
      ScanIndexForward: false,
    });

    const docClient = getDynamoDBDocClient();
    const [inProgress, complete] = await Promise.all([
      docClient.send(inProgressCommand),
      docClient.send(completeCommand),
    ]);

    const allMeetings = [
      ...(inProgress.Items || []),
      ...(complete.Items || []),
    ] as Meeting[];

    allMeetings.sort((a, b) => {
      const statusOrder = { in_progress: 0, complete: 1 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      meetings: allMeetings.slice(0, limit),
      paginationState: {
        inProgressKey: inProgress.LastEvaluatedKey,
        completeKey: complete.LastEvaluatedKey,
      },
      hasMore: !!(inProgress.LastEvaluatedKey || complete.LastEvaluatedKey),
    };
  } catch (error) {
    console.error('Error listing meetings from DynamoDB:', error);
    throw error;
  }
}

// Update a meeting
export async function updateMeeting(id: string, updates: Partial<Meeting>) {
  try {
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    Object.keys(updates).forEach((key, index) => {
      if (key !== 'id') {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;
        updateExpression.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = updates[key as keyof Meeting];
      }
    });

    if (updates.notes !== undefined) {
      const statusKey = `#status`;
      const statusValue =
        updates.notes && updates.notes.trim().length > 0
          ? ':complete'
          : ':in_progress';
      updateExpression.push(`${statusKey} = ${statusValue}`);
      expressionAttributeNames[statusKey] = 'status';
      expressionAttributeValues[statusValue] =
        updates.notes && updates.notes.trim().length > 0
          ? 'complete'
          : 'in_progress';
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(id)',
    });

    const response = await getDynamoDBDocClient().send(command);
    return response.Attributes as Meeting;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new Error(`Meeting with ID ${id} not found`);
    }
    console.error('Error updating meeting in DynamoDB:', error);
    throw error;
  }
}

// Delete a meeting by ID
export async function deleteMeeting(id: string) {
  try {
    const command = new DeleteCommand({
      TableName,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)',
    });
    await getDynamoDBDocClient().send(command);
    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new Error(`Meeting with ID ${id} not found`);
    }
    console.error('Error deleting meeting from DynamoDB:', error);
    throw error;
  }
}