import React, { useState, useEffect } from 'react';
import { Share2, Download, Eye, Plus, Search } from 'lucide-react';
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

  const handleExport = async () => {
    if (!analysis?.analysis_json) return;

    const csvContent = [
      'Type,Content,Owner,Due Date,Priority,Timestamp',
      ...analysis.analysis_json.action_items.map(item => 
        `Action Item,"${item.text.replace(/"/g, '""')}","${item.owner}","${item.due_date || ''}","${item.priority}",${item.timestamp}`
      ),
      ...analysis.analysis_json.timeline_events.map(event =>
        `Timeline,"${event.title.replace(/"/g, '""')}","","","",${event.time}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting?.title || 'meeting'}-analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Analysis exported successfully!');
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
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                  <button
                    onClick={() => toast.success('Raw transcript view coming soon!')}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Eye size={14} />
                    <span>View raw transcript</span>
                  </button>
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
        }}
        analysisId={analysis.id}
        initialText={taskInitialText}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};