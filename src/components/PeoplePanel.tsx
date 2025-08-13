import React from 'react';
import { User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Speaker } from '../lib/supabase';

interface PeoplePanelProps {
  speakers: Speaker[];
  onSpeakerClick: (speakerName: string) => void;
}

export const PeoplePanel: React.FC<PeoplePanelProps> = ({
  speakers,
  onSpeakerClick
}) => {
  // Force re-render when speakers change
  const speakerList = React.useMemo(() => speakers, [speakers]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">People</h2>

      <div className="space-y-3">
        {speakerList.map((speaker, index) => (
          <motion.div
            key={speaker.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSpeakerClick(speaker.name)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
              getAvatarColor(speaker.name)
            }`}>
              {speaker.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {speaker.name}
                </p>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round(speaker.speaking_percentage)}%
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600">
                  {formatDuration(speaker.speaking_time_seconds)}
                </span>
              </div>
              
              {/* Speaking time bar */}
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${speaker.speaking_percentage}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}

        {speakerList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No speakers identified</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};