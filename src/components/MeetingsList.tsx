import React, { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle, XCircle, Play, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, Meeting } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface MeetingsListProps {
  onMeetingSelect: (meetingId: string) => void;
  onUploadClick: () => void;
  processingMeetingId?: string;
}

export const MeetingsList: React.FC<MeetingsListProps> = ({
  onMeetingSelect,
  onUploadClick,
  processingMeetingId
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchMeetings = async () => {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Failed to load meetings');
          return;
        }

        setMeetings(data || []);
      } catch (error) {
        toast.error('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();

    // Subscribe to meeting updates
    const subscription = supabase
      .channel('meetings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetings',
        filter: `owner_id=eq.${user.id}`
      }, () => {
        fetchMeetings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleDeleteMeeting = async (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
      return;
    }

    try {
      // Delete audio file from storage if it exists
      if (meeting.audio_path) {
        const { error: deleteError } = await supabase.storage
          .from('meeting-audio')
          .remove([meeting.audio_path]);
        
        if (deleteError) {
          console.warn('Failed to delete audio file:', deleteError);
        }
      }

      // Delete meeting record (cascade will handle related records)
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meeting.id);

      if (error) {
        toast.error('Failed to delete meeting');
        return;
      }

      toast.success('Meeting deleted successfully');
      setMeetings(prev => prev.filter(m => m.id !== meeting.id));
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const getStatusIcon = (status: string, meetingId: string) => {
    const isProcessing = processingMeetingId === meetingId;
    
    if (isProcessing || status === 'processing') {
      return <Clock size={16} className="text-blue-600 animate-spin" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      case 'uploaded':
        return <Clock size={16} className="text-orange-600" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: string, meetingId: string) => {
    const isProcessing = processingMeetingId === meetingId;
    
    if (isProcessing) return 'Processing...';
    
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      case 'uploaded':
        return 'Uploaded';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Upload size={24} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Meeting Visualizer</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Transform your meeting recordings into actionable insights with AI-powered transcription, 
            sentiment analysis, and smart action item extraction.
          </p>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm space-x-2"
          >
            <Upload size={16} />
            <span>Upload Audio</span>
          </button>
        </div>

        {meetings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Meetings</h2>
            <div className="space-y-4">
              {meetings.map((meeting, index) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => meeting.status === 'completed' && onMeetingSelect(meeting.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            {meeting.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(meeting.status, meeting.id)}
                            <span className="text-sm text-gray-600">
                              {getStatusText(meeting.status, meeting.id)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                          <span>{new Date(meeting.created_at).toLocaleTimeString()}</span>
                          {meeting.duration_seconds && (
                            <span>{Math.round(meeting.duration_seconds / 60)} minutes</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {meeting.status === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMeetingSelect(meeting.id);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Analysis"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteMeeting(meeting, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Meeting"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {meetings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
            <p className="text-gray-500 mb-6">Upload your first audio file to get started</p>
            <button
              onClick={onUploadClick}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors space-x-2"
            >
              <Upload size={16} />
              <span>Upload Audio</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};