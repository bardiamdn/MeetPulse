import React, { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/AuthModal';
import { MeetingsList } from './components/MeetingsList';
import { UploadModal } from './components/UploadModal';
import { Dashboard } from './components/Dashboard';

function App() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [processingMeetingId, setProcessingMeetingId] = useState<string | null>(null);

  const handleUploadStart = useCallback((meetingId: string) => {
    setProcessingMeetingId(meetingId);
    setSelectedMeetingId(meetingId);
    setShowUploadModal(false);
  }, []);

  const handleBackToMeetings = useCallback(() => {
    setSelectedMeetingId(null);
    setProcessingMeetingId(null);
  }, []);

  const handleMeetingSelect = useCallback((meetingId: string) => {
    setSelectedMeetingId(meetingId);
  }, []);

  const handleUploadClick = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Initializing application...</p>
        </div>
      </div>
    );
  }

  console.log('App render - User:', user?.email || 'No user', 'Loading:', loading, 'Timestamp:', new Date().toISOString());

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Meeting Visualizer</h1>
              <p className="text-lg text-gray-600 mb-8">
                Transform your meetings into actionable insights with AI-powered analysis
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
        <Toaster position="top-right" />
      </>
    );
  }

  if (selectedMeetingId) {
    return (
      <>
        <Dashboard 
          meetingId={selectedMeetingId}
          onBack={handleBackToMeetings}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <MeetingsList 
        onMeetingSelect={handleMeetingSelect}
        onUploadClick={handleUploadClick}
        processingMeetingId={processingMeetingId}
      />
      
      <UploadModal
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        onUploadStart={handleUploadStart}
      />
      
      <Toaster position="top-right" />
    </>
  );
}

export default App;