import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { processVoiceAction, executeVoiceAction, VoiceAction } from '@/lib/voice-action-engine';

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'https://k1r3ok.celestiai.co';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'ideapakpaphon@gmail.com';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'Idea08112550';

export async function POST(request: NextRequest) {
  try {
    const { transcript, userId, userStoreId, action: overrideAction } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript required' }, { status: 400 });
    }

    // Initialize PocketBase (admin auth for writes)
    const pb = new PocketBase(PB_URL);
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

    // Process voice → intent
    let action: VoiceAction;
    if (overrideAction) {
      action = overrideAction;
    } else {
      action = await processVoiceAction(transcript);
    }

    // Execute the action
    const result = await executeVoiceAction(action, {
      userId,
      userStoreId,
      pb,
    });

    // Log for analytics
    try {
      await pb.collection('voice_logs').create({
        user: userId || '',
        transcript,
        intent: action.intent,
        confidence: action.confidence,
        extracted_data: JSON.stringify(action.extractedData),
        success: result.success,
        record_id: result.recordId || '',
      });
    } catch (logError) {
      console.error('[Voice API] Log failed:', logError);
    }

    return NextResponse.json({
      success: result.success,
      action: action.intent,
      confidence: action.confidence,
      extractedData: action.extractedData,
      suggestedResponse: action.suggestedResponse,
      recordId: result.recordId,
      message: result.message,
    });
  } catch (error: any) {
    console.error('[Voice API] Error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to process voice command' },
      { status: 500 }
    );
  }
}
