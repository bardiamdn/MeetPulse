import React, { useState, useEffect } from 'react';
import { Share2, Download, Eye, Plus, Search, User } from 'lucide-react';
import { supabase, Analysis, Meeting, ActionItem, TranscriptSegment } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { SummaryCard } from './SummaryCard';
import { Timeline } from './Timeline';
import { SentimentChart } from './SentimentChart';
import { TranscriptViewer } from './TranscriptViewer';
import { ActionItemsPanel } from './ActionItemsPanel';
import { PeoplePanel } from './PeoplePanel';
import { ProcessingState } from './ProcessingState';
import { TaskModal } from './TaskModal';
import { SpeakerModal } from './SpeakerModal';
import { RawTranscriptModal } from './RawTranscriptModal';
import toast from 'react-hot-toast';

interface DashboardProps {
  meetingId: string;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ meetingId, onBack }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskInitialText, setTaskInitialText] = useState('');
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [showRawTranscriptModal, setShowRawTranscriptModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!meetingId || !user) return;

    const fetchData = async () => {
      try {
        // Fetch meeting
        const { data: meetingData, error: meetingError } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .eq('owner_id', user.id)
          .single();

        if (meetingError) {
          toast.error('Meeting not found');
          onBack();
          return;
        }

        setMeeting(meetingData);

        // Fetch analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('analyses')
          .select('*')
          .eq('meeting_id', meetingId)
          .single();

        if (analysisError && analysisError.code !== 'PGRST116') {
          console.error('Analysis fetch error:', analysisError);
          return;
        }

        if (analysisData) {
          setAnalysis(analysisData);

          if (analysisData.status === 'ready') {
            // Fetch transcript segments
            const { data: segments } = await supabase
              .from('transcript_segments')
              .select('*')
              .eq('analysis_id', analysisData.id)
              .order('start_sec');

            if (segments) setTranscriptSegments(segments);

            // Fetch action items
            const { data: actions } = await supabase
              .from('action_items')
              .select('*')
              .eq('analysis_id', analysisData.id)
              .order('created_at');

            if (actions) setActionItems(actions);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load meeting data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to analysis updates
    const analysisSubscription = supabase
      .channel(`analysis-${meetingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'analyses',
        filter: `meeting_id=eq.${meetingId}`
      }, (payload) => {
        setAnalysis(payload.new as Analysis);
        if (payload.new.status === 'ready') {
          window.location.reload(); // Refresh to load all related data
        }
      })
      .subscribe();

    return () => {
      analysisSubscription.unsubscribe();
    };
  }, [meetingId, user, onBack]);

  const handleTimestampClick = (timestamp: number) => {
    setCurrentTimestamp(timestamp);
  };

  const handleActionItemToggle = async (actionItem: ActionItem) => {
    const { error } = await supabase
      .from('action_items')
      .update({
        completed: !actionItem.completed,
        completed_at: !actionItem.completed ? new Date().toISOString() : null
      })
      .eq('id', actionItem.id);

    if (error) {
      toast.error('Failed to update action item');
      return;
    }

    setActionItems(prev =>
      prev.map(item =>
        item.id === actionItem.id
          ? {
              ...item,
              completed: !item.completed,
              completed_at: !item.completed ? new Date().toISOString() : null
            }
          : item
      )
    );
  };

  const handleCreateTask = (initialText: string = '') => {
    setTaskInitialText(initialText);
    setShowTaskModal(true);
  };

  const handleTaskCreated = (newTask: ActionItem) => {
    setActionItems(prev => [...prev, newTask]);
    setShowTaskModal(false);
    setTaskInitialText('');
  };

  const handleEditTask = (task: ActionItem) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdated = (updatedTask: ActionItem) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === updatedTask.id ? updatedTask : item
      )
    );
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleSpeakerUpdate = async (speakerMappings: Record<string, string>) => {
    if (!analysis) return;

    try {
      // Update transcript segments with new speaker names
      const updatePromises = transcriptSegments.map(segment => {
        const newSpeakerName = speakerMappings[segment.speaker];
        if (newSpeakerName && newSpeakerName !== segment.speaker) {
          return supabase
            .from('transcript_segments')
            .update({ speaker: newSpeakerName })
            .eq('id', segment.id);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(updatePromises);

      // Update local state
      setTranscriptSegments(prev =>
        prev.map(segment => {
          const newSpeaker = speakerMappings[segment.speaker] || segment.speaker;
          return {
            ...segment,
            speaker: newSpeaker
          };
        })
      );

      // Update analysis JSON with new speaker names
      const updatedAnalysisJson = {
        ...analysis.analysis_json,
        speakers: analysis.analysis_json.speakers.map(speaker => ({
          ...speaker,
          name: speakerMappings[speaker.name] || speaker.name
        })),
        transcript_segments: analysis.analysis_json.transcript_segments.map(segment => ({
          ...segment,
          speaker: speakerMappings[segment.speaker] || segment.speaker
        }))
      };

      const { error: updateError } = await supabase
        .from('analyses')
        .update({ analysis_json: updatedAnalysisJson })
        .eq('id', analysis.id);

      if (updateError) {
        throw updateError;
      }
      
      setAnalysis(prev => prev ? {
        ...prev,
        analysis_json: updatedAnalysisJson
      } : null);

      toast.success('Speaker names updated successfully!');
      setShowSpeakerModal(false);
    } catch (error) {
      console.error('Error updating speakers:', error);
      toast.error('Failed to update speaker names');
    }
  };

  const handleExport = async () => {
    if (!analysis?.analysis_json || !meeting) return;

    // Helper function to escape CSV values
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Format time helper
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Create comprehensive CSV content
    const csvSections = [];

    // Meeting Information
    csvSections.push('MEETING INFORMATION');
    csvSections.push('Field,Value');
    csvSections.push(`Title,${escapeCSV(meeting.title)}`);
    csvSections.push(`Date,${escapeCSV(new Date(meeting.created_at).toLocaleDateString())}`);
    csvSections.push(`Duration,${meeting.duration_seconds ? Math.round(meeting.duration_seconds / 60) + ' minutes' : 'N/A'}`);
    csvSections.push(`Status,${escapeCSV(meeting.status)}`);
    csvSections.push('');

    // Summary
    csvSections.push('SUMMARY');
    csvSections.push('Content');
    csvSections.push(escapeCSV(analysis.analysis_json.summary));
    csvSections.push('');

    // Action Items
    csvSections.push('ACTION ITEMS');
    csvSections.push('Text,Owner,Due Date,Priority,Timestamp,Completed,Confidence');
    
    // Use the current actionItems state which includes user-created tasks
    actionItems.forEach(item => {
      csvSections.push([
        escapeCSV(item.text),
        escapeCSV(item.owner || ''),
        escapeCSV(item.due_date || ''),
        escapeCSV(item.priority),
        item.timestamp_sec ? formatTime(item.timestamp_sec) : '',
        escapeCSV(item.completed ? 'Yes' : 'No'),
        escapeCSV(Math.round((item.confidence || 0) * 100) + '%')
      ].join(','));
    });
    csvSections.push('');

    // Timeline Events
    csvSections.push('TIMELINE EVENTS');
    csvSections.push('Time,Title,Description,Importance');
    analysis.analysis_json.timeline_events.forEach(event => {
      csvSections.push([
        formatTime(event.time),
        escapeCSV(event.title),
        escapeCSV(event.description),
        escapeCSV(Math.round(event.importance * 100) + '%')
      ].join(','));
    });
    csvSections.push('');

    // Speakers
    csvSections.push('SPEAKERS');
    csvSections.push('Name,Speaking Time,Speaking Percentage');
    analysis.analysis_json.speakers.forEach(speaker => {
      const minutes = Math.floor(speaker.speaking_time_seconds / 60);
      const seconds = Math.floor(speaker.speaking_time_seconds % 60);
      const timeStr = `${minutes}m ${seconds}s`;
      
      csvSections.push([
        escapeCSV(speaker.name),
        timeStr,
        escapeCSV(Math.round(speaker.speaking_percentage) + '%')
      ].join(','));
    });
    csvSections.push('');

    // Sentiment Data
    csvSections.push('SENTIMENT ANALYSIS');
    csvSections.push('Time,Sentiment Value,Sentiment Description');
    analysis.analysis_json.sentiment.forEach(point => {
      const sentimentDesc = point.value > 0.3 ? 'Positive' : 
                           point.value < -0.3 ? 'Negative' : 'Neutral';
      csvSections.push([
        formatTime(point.time),
        escapeCSV(Math.round(point.value * 100)),
        sentimentDesc
      ].join(','));
    });
    csvSections.push('');

    // Transcript
    csvSections.push('TRANSCRIPT');
    csvSections.push('Speaker,Start Time,End Time,Text,Confidence');
    transcriptSegments.forEach(segment => {
      csvSections.push([
        escapeCSV(segment.speaker),
        formatTime(segment.start_sec),
        formatTime(segment.end_sec),
        escapeCSV(segment.text),
        escapeCSV(Math.round(segment.confidence * 100) + '%')
      ].join(','));
    });

    const csvContent = csvSections.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Complete analysis exported successfully!');
  };

  if (loading) {
    return <ProcessingState status="processing" progress={25} />;
  }

  if (!analysis || analysis.status === 'processing') {
    return <ProcessingState status="processing" progress={50} />;
  }

  if (analysis.status === 'failed') {
    return <ProcessingState status="failed" />;
  }

  if (!analysis.analysis_json) {
    return <ProcessingState status="processing" progress={75} />;
  }

  const filteredSegments = transcriptSegments.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {meeting?.title || 'Meeting Analysis'}
                </h1>
                <p className="text-sm text-gray-500">
                  {new Date(meeting?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toast.success('Share functionality coming soon!')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors flex items-center space-x-2"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Insights */}
          <div className="lg:col-span-3 space-y-6">
            <SummaryCard
              summary={analysis.analysis_json.summary}
              confidence={analysis.confidence_score}
              onCreateTask={handleCreateTask}
            />
            
            <Timeline
              events={analysis.analysis_json.timeline_events}
              onEventClick={handleTimestampClick}
              currentTimestamp={currentTimestamp}
            />
            
            <SentimentChart
              sentimentData={analysis.analysis_json.sentiment}
              onTimestampClick={handleTimestampClick}
            />
          </div>

          {/* Center Column - Transcript */}
          <div className="lg:col-span-6 flex">
            <div className="bg-white rounded-xl shadow-sm w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSpeakerModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <User size={14} />
                      <span>Edit speakers</span>
                    </button>
                    <button
                      onClick={() => setShowRawTranscriptModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Eye size={14} />
                      <span>View raw</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transcript..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <TranscriptViewer
                segments={filteredSegments}
                currentTimestamp={currentTimestamp}
                onSegmentClick={handleTimestampClick}
              />
            </div>
          </div>

          {/* Right Column - Actions & People */}
          <div className="lg:col-span-3 space-y-6">
            <ActionItemsPanel
              actionItems={actionItems}
              onToggleComplete={handleActionItemToggle}
              onAddTask={handleCreateTask}
              onEditTask={handleEditTask}
            />
            
            <PeoplePanel
              speakers={analysis.analysis_json.speakers}
              onSpeakerClick={(speakerName) => {
                setSearchQuery(speakerName);
              }}
            />
          </div>
        </div>
      </div>
      
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setTaskInitialText('');
          setEditingTask(null);
        }}
        analysisId={analysis.id}
        initialText={taskInitialText}
        editingTask={editingTask}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
      />
      
      <SpeakerModal
        isOpen={showSpeakerModal}
        onClose={() => setShowSpeakerModal(false)}
        speakers={analysis?.analysis_json.speakers || []}
        onUpdate={handleSpeakerUpdate}
      />
      
      <RawTranscriptModal
        isOpen={showRawTranscriptModal}
        onClose={() => setShowRawTranscriptModal(false)}
        rawTranscript={analysis?.raw_transcript}
        meetingTitle={meeting?.title || 'Meeting'}
      />
    </div>
  );
};