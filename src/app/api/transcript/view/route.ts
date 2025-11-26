/**
 * This file handles the API route for generating a presigned URL to view a transcript file in S3.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPresignedViewUrl } from '@/lib/s3';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const viewUrl = await getPresignedViewUrl(key);
    return NextResponse.json({ viewUrl });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate view URL' },
      { status: 500 }
    );
  }
}
