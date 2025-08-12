/*
  # Add INSERT policy for action_items table

  1. Security
    - Add policy for authenticated users to insert action items
    - Ensures users can only create action items for their own meetings
    - Validates that the analysis_id belongs to a meeting owned by the user

  2. Changes
    - Creates INSERT policy that checks ownership through the analysis -> meeting relationship
*/

-- Add INSERT policy for action_items table
CREATE POLICY "Users can insert own action items"
  ON action_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM analyses a
      JOIN meetings m ON a.meeting_id = m.id
      WHERE a.id = analysis_id AND m.owner_id = auth.uid()
    )
  );