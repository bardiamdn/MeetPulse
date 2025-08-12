/*
  # Fix RLS Policies for Upload Functionality

  1. Storage Policies
    - Allow authenticated users to upload files to their own folder
    - Allow authenticated users to read their own files
    - Allow authenticated users to delete their own files

  2. Meeting Table Policies
    - Ensure INSERT policy allows authenticated users to create meetings with their own owner_id
    - Verify other CRUD policies are working correctly

  3. Security
    - All policies restrict access to user's own data only
    - Storage policies use folder-based access control
*/

-- Storage policies for meeting-audio bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-audio', 'meeting-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meeting-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'meeting-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'meeting-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Ensure meetings table has correct INSERT policy
DROP POLICY IF EXISTS "Users can insert own meetings" ON meetings;
CREATE POLICY "Users can insert own meetings" ON meetings
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Ensure profiles table has correct INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());