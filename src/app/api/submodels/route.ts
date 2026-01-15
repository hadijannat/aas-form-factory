/**
 * Submodels API Route
 * Proxy to BaSyx AAS Environment for submodel operations
 */

import { NextResponse } from 'next/server';
import { BaSyxClient, BaSyxError } from '@/lib/api/basyx-client';

// Create client with environment variables if available
const client = new BaSyxClient({
  environmentUrl: process.env.BASYX_ENVIRONMENT_URL || 'http://localhost:4001',
  registryUrl: process.env.BASYX_REGISTRY_URL || 'http://localhost:4000',
});

/**
 * GET /api/submodels
 * List all submodels from BaSyx
 */
export async function GET() {
  try {
    const submodels = await client.listSubmodels();
    return NextResponse.json({ submodels });
  } catch (error) {
    console.error('Error listing submodels:', error);

    if (error instanceof BaSyxError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect to BaSyx. Is the server running?' },
      { status: 503 }
    );
  }
}

/**
 * POST /api/submodels
 * Create or update a submodel in BaSyx
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submodel, upsert = true } = body;

    if (!submodel) {
      return NextResponse.json(
        { error: 'submodel is required' },
        { status: 400 }
      );
    }

    let result;
    if (upsert) {
      result = await client.saveSubmodel(submodel);
    } else {
      result = await client.createSubmodel(submodel);
    }

    return NextResponse.json({ submodel: result });
  } catch (error) {
    console.error('Error saving submodel:', error);

    if (error instanceof BaSyxError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save submodel' },
      { status: 500 }
    );
  }
}
