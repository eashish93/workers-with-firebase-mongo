import { NextResponse, NextRequest } from 'next/server';

// Health check
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
  });
}

// don't cache
export const revalidate = 0;
