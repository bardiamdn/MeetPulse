/*
  # AI Meeting Visualizer Database Schema

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `meetings` - Meeting records with audio storage paths
    - `analyses` - AI analysis results and processing status
    - `transcript_segments` - Individual transcript segments with timestamps
    - `action_items` - Extracted action items with assignments and due dates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Secure audio file access through storage policies

  3. Features
    - Real-time status tracking for AI processing
    - Structured JSON storage for analysis results
    - Speaker identification and sentiment analysis
    - Token usage tracking for cost monitoring
*/

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  audio_path text, -- Supabase storage path
  audio_size bigint,
  duration_seconds numeric,
  language text DEFAULT 'en',
  status text CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')) DEFAULT 'uploaded',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analyses table (core AI results)
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  status text CHECK (status IN ('processing', 'ready', 'failed')) DEFAULT 'processing',
  model text DEFAULT 'whisper-1',
  raw_transcript jsonb, -- Raw Whisper output with segments
  analysis_json jsonb, -- Structured analysis (summary, actions, timeline, sentiment)
  token_usage jsonb, -- Track API costs
  confidence_score numeric DEFAULT 0.0,
  processing_time_ms integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transcript segments (for detailed display)
CREATE TABLE IF NOT EXISTS transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  start_sec numeric NOT NULL,
  end_sec numeric NOT NULL,
  text text NOT NULL,
  confidence numeric DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Action items (extracted tasks)
CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  text text NOT NULL,
  owner text,
  assignee_id uuid REFERENCES profiles(id),
  due_date date,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  timestamp_sec numeric,
  confidence numeric DEFAULT 0.0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for meetings
CREATE POLICY "Users can read own meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for analyses
CREATE POLICY "Users can read own analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meetings 
    WHERE meetings.id = analyses.meeting_id 
    AND meetings.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meetings 
    WHERE meetings.id = analyses.meeting_id 
    AND meetings.owner_id = auth.uid()
  ));

-- RLS Policies for transcript_segments
CREATE POLICY "Users can read own transcript segments"
  ON transcript_segments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM analyses 
    JOIN meetings ON meetings.id = analyses.meeting_id
    WHERE analyses.id = transcript_segments.analysis_id 
    AND meetings.owner_id = auth.uid()
  ));

-- RLS Policies for action_items
CREATE POLICY "Users can read own action items"
  ON action_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM analyses 
    JOIN meetings ON meetings.id = analyses.meeting_id
    WHERE analyses.id = action_items.analysis_id 
    AND meetings.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update own action items"
  ON action_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM analyses 
    JOIN meetings ON meetings.id = analyses.meeting_id
    WHERE analyses.id = action_items.analysis_id 
    AND meetings.owner_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_owner_id ON meetings(owner_id);
CREATE INDEX IF NOT EXISTS idx_analyses_meeting_id ON analyses(meeting_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_analysis_id ON transcript_segments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_time ON transcript_segments(start_sec, end_sec);
CREATE INDEX IF NOT EXISTS idx_action_items_analysis_id ON action_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_action_items_completed ON action_items(completed);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_action_items_updated_at
    BEFORE UPDATE ON action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();