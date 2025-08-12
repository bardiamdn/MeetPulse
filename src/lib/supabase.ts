import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage configuration
export const AUDIO_BUCKET = import.meta.env.VITE_SUPABASE_AUDIO_BUCKET || 'meeting-audio';

// Database types
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  owner_id: string;
  title: string;
  audio_path: string | null;
  audio_size: number | null;
  duration_seconds: number | null;
  language: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  meeting_id: string;
  status: 'processing' | 'ready' | 'failed';
  model: string;
  raw_transcript: any;
  analysis_json: {
    summary: string;
    action_items: ActionItem[];
    timeline_events: TimelineEvent[];
    sentiment: SentimentPoint[];
    speakers: Speaker[];
    transcript_segments: TranscriptSegment[];
  };
  token_usage: any;
  confidence_score: number;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  analysis_id: string;
  speaker: string;
  start_sec: number;
  end_sec: number;
  text: string;
  confidence: number;
  created_at: string;
}

export interface ActionItem {
  id: string;
  analysis_id: string;
  text: string;
  owner: string;
  assignee_id: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  timestamp_sec: number | null;
  confidence: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  time: number;
  title: string;
  description: string;
  importance: number;
}

export interface SentimentPoint {
  time: number;
  value: number;
}

export interface Speaker {
  name: string;
  speaking_time_seconds: number;
  speaking_percentage: number;
}