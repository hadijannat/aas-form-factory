/**
 * Templates API Route
 * Fetches IDTA Submodel Templates
 */

import { NextResponse } from 'next/server';
import {
  listTemplates,
  fetchTemplateById,
  extractSubmodel,
} from '@/lib/parser/template-fetcher';

/**
 * GET /api/templates
 * List all available templates
 */
export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Fetch a specific template by ID
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    const environment = await fetchTemplateById(templateId);
    const submodel = extractSubmodel(environment);

    return NextResponse.json({
      environment,
      submodel,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
