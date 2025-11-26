/**
 * This file is a DynamoDB utility file for the AI Meeting Tool.
 * It contains functions to interact with DynamoDB, including creating a table,
 * inserting items, and querying items.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

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
  createdAt: string;
  updatedAt: string;
}

// Create a new meeting
export async function createMeeting(meeting: Meeting) {
  try {
    // Validate table name
    if (!TableName) {
      throw new Error('DynamoDB table name is not defined');
    }

    const command = new PutCommand({
      TableName,
      Item: meeting,
    });

    await docClient.send(command);
    return meeting;
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

    const response = await docClient.send(command);
    return response.Item as Meeting | undefined;
  } catch (error) {
    console.error('Error getting meeting from DynamoDB:', error);
    throw error;
  }
}

// List all meetings
export async function listMeetings() {
  try {
    const command = new ScanCommand({
      TableName,
    });

    const response = await docClient.send(command);
    const meetings = (response.Items || []) as Meeting[];

    // Sort by status (In Progress first) then by date (newest first)
    return meetings.sort((a, b) => {
      // Status priority: In Progress (no notes) > Complete (has notes)
      const aStatus = a.notes ? 1 : 0; // 0 = In Progress, 1 = Complete
      const bStatus = b.notes ? 1 : 0;

      if (aStatus !== bStatus) {
        return aStatus - bStatus; // In Progress first
      }

      // Same status, sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error listing meetings from DynamoDB:', error);
    throw error;
  }
}

// Update a meeting
export async function updateMeeting(id: string, updates: Partial<Meeting>) {
  try {
    // First get the existing meeting
    const existingMeeting = await getMeeting(id);
    if (!existingMeeting) {
      throw new Error(`Meeting with ID ${id} not found`);
    }

    // Create updated meeting
    const updatedMeeting = {
      ...existingMeeting,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save it back to DynamoDB
    const command = new PutCommand({
      TableName,
      Item: updatedMeeting,
    });

    await docClient.send(command);
    return updatedMeeting;
  } catch (error) {
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
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting meeting from DynamoDB:', error);
    throw error;
  }
}
