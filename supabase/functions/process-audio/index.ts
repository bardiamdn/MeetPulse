import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface TranscriptSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface WhisperResponse {
  text: string;
  segments: TranscriptSegment[];
  language: string;
}

interface AnalysisResult {
  summary: string;
  action_items: Array<{
    id: string;
    text: string;
    owner: string;
    timestamp: number;
    due_date: string | null;
    confidence: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  timeline_events: Array<{
    id: string;
    time: number;
    title: string;
    description: string;
    importance: number;
  }>;
  sentiment: Array<{
    time: number;
    value: number;
  }>;
  speakers: Array<{
    name: string;
    speaking_time_seconds: number;
    speaking_percentage: number;
  }>;
  transcript_segments: Array<{
    id: string;
    speaker: string;
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { meetingId, audioPath } = await req.json();

    if (!meetingId || !audioPath) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Create analysis record
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        meeting_id: meetingId,
        status: 'processing'
      })
      .select()
      .single();

    if (analysisError) {
      throw new Error(`Failed to create analysis: ${analysisError.message}`);
    }

    const analysisId = analysisData.id;

    try {
      // Download audio from Supabase Storage
      const { data: audioBlob, error: downloadError } = await supabase.storage
        .from('meeting-audio')
        .download(audioPath);

      if (downloadError) {
        throw new Error(`Failed to download audio: ${downloadError.message}`);
      }

      // Transcribe with OpenAI Whisper
      const formData = new FormData();
      // Extract file extension from audioPath to preserve original format
      const fileExtension = audioPath.split('.').pop() || 'wav';
      const fileName = `audio.${fileExtension}`;
      formData.append('file', audioBlob, fileName);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const error = await transcriptionResponse.text();
        const errorData = JSON.parse(error);
        if (errorData.error?.code === 'insufficient_quota') {
          throw new Error('OpenAI API quota exceeded. Please check your OpenAI billing and upgrade your plan.');
        } else if (errorData.error?.code === 'invalid_api_key') {
          throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
        } else {
          throw new Error(`OpenAI transcription failed: ${errorData.error?.message || error}`);
        }
      }

      const whisperResult: WhisperResponse = await transcriptionResponse.json();

      // Update with raw transcript
      await supabase
        .from('analyses')
        .update({
          raw_transcript: whisperResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      // Extract structured data with GPT
      const extractionPrompt = `You are a meeting analyst that returns ONLY valid JSON. Given the following timestamped transcript segments, produce a JSON response with this exact structure:

{
  "summary": "Brief 1-2 sentence summary of the meeting",
  "action_items": [
    {
      "id": "unique-id",
      "text": "Action item description",
      "owner": "Person responsible",
      "timestamp": 123.45,
      "due_date": "2024-01-15",
      "confidence": 0.95,
      "priority": "medium"
    }
  ],
  "timeline_events": [
    {
      "id": "unique-id",
      "time": 123.45,
      "title": "Event title",
      "description": "Brief description",
      "importance": 0.8
    }
  ],
  "sentiment": [
    {
      "time": 0,
      "value": 0.2
    }
  ],
  "speakers": [
    {
      "name": "Speaker Name",
      "speaking_time_seconds": 45.2,
      "speaking_percentage": 35.5
    }
  ],
  "transcript_segments": [
    {
      "id": "unique-id",
      "speaker": "Speaker Name",
      "start": 0.0,
      "end": 5.2,
      "text": "Transcript text",
      "confidence": 0.95
    }
  ]
}

Transcript segments: ${JSON.stringify(whisperResult.segments)}

Return only valid JSON, no other text.`;

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a meeting analyst that returns only valid JSON responses. Extract structured meeting data from transcripts.'
            },
            {
              role: 'user',
              content: extractionPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }),
      });

      if (!gptResponse.ok) {
        const error = await gptResponse.text();
        throw new Error(`OpenAI analysis failed: ${error}`);
      }

      const gptResult = await gptResponse.json();
      
      // Clean the GPT response content to remove markdown code blocks and extra whitespace
      let gptContent = gptResult.choices[0].message.content.trim();
      
      // Remove markdown code block fences if present
      gptContent = gptContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      gptContent = gptContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      gptContent = gptContent.trim();
      
      const analysisJson: AnalysisResult = JSON.parse(gptContent);

      // Update analysis with final results
      await supabase
        .from('analyses')
        .update({
          analysis_json: analysisJson,
          status: 'ready',
          confidence_score: 0.9,
          token_usage: {
            transcription_tokens: whisperResult.segments?.length || 0,
            analysis_tokens: gptResult.usage?.total_tokens || 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      // Insert transcript segments
      const transcriptSegments = analysisJson.transcript_segments.map(segment => ({
        analysis_id: analysisId,
        speaker: segment.speaker,
        start_sec: segment.start,
        end_sec: segment.end,
        text: segment.text,
        confidence: segment.confidence
      }));

      if (transcriptSegments.length > 0) {
        await supabase
          .from('transcript_segments')
          .insert(transcriptSegments);
      }

      // Insert action items
      const actionItems = analysisJson.action_items.map(item => ({
        analysis_id: analysisId,
        text: item.text,
        owner: item.owner,
        due_date: item.due_date,
        priority: item.priority,
        timestamp_sec: item.timestamp,
        confidence: item.confidence
      }));

      if (actionItems.length > 0) {
        await supabase
          .from('action_items')
          .insert(actionItems);
      }

      // Update meeting status
      await supabase
        .from('meetings')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);

      return new Response(
        JSON.stringify({ success: true, analysisId }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (processingError) {
      // Update analysis with error
      await supabase
        .from('analyses')
        .update({
          status: 'failed',
          error_message: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      // Update meeting status
      await supabase
        .from('meetings')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);

      throw processingError;
    }

  } catch (error) {
    console.error('Error processing audio:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});