import React, { useState, useEffect } from 'react';
import { X, User, Save } from 'lucide-react';
import { Speaker } from '../lib/supabase';

interface SpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakers: Speaker[];
  onUpdate: (speakerMappings: Record<string, string>) => void;
}

export const SpeakerModal: React.FC<SpeakerModalProps> = ({
  isOpen,
  onClose,
  speakers,
  onUpdate
}) => {
  const [speakerMappings, setSpeakerMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && speakers.length > 0) {
      const initialMappings: Record<string, string> = {};
      speakers.forEach(speaker => {
        initialMappings[speaker.name] = speaker.name;
      });
      setSpeakerMappings(initialMappings);
    }
  }, [isOpen, speakers]);

  const handleSpeakerNameChange = (originalName: string, newName: string) => {
    setSpeakerMappings(prev => ({
      ...prev,
      [originalName]: newName.trim()
    }));
  };

  const handleSave = () => {
    // Only include mappings where the name actually changed
    const changedMappings: Record<string, string> = {};
    Object.entries(speakerMappings).forEach(([original, updated]) => {
      if (original !== updated && updated.trim()) {
        changedMappings[original] = updated.trim();
      }
    });

    if (Object.keys(changedMappings).length === 0) {
      // No changes made, just close the modal
      onClose();
      return;
    }
    onUpdate(changedMappings);
    onClose();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Speaker Names</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {speakers.map((speaker, index) => (
            <div key={speaker.name} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                getAvatarColor(speaker.name)
              }`}>
                {(speakerMappings[speaker.name] || speaker.name).charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={speakerMappings[speaker.name] || speaker.name}
                  onChange={(e) => handleSpeakerNameChange(speaker.name, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter speaker name..."
                />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{formatDuration(speaker.speaking_time_seconds)}</span>
                  <span>{Math.round(speaker.speaking_percentage)}% of meeting</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Give speakers meaningful names like "Project Manager", "Client", or actual names if known.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};