import React, { useEffect, useRef } from 'react';
import { User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { TranscriptSegment } from '../lib/supabase';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTimestamp: number;
  onSegmentClick: (timestamp: number) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  segments,
  currentTimestamp,
  onSegmentClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAvatarColor = (speaker: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const isActiveSegment = (segment: TranscriptSegment) => {
    return currentTimestamp >= segment.start_sec && currentTimestamp <= segment.end_sec;
  };

  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTimestamp]);

  if (!segments.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Clock size={24} className="mx-auto mb-2 opacity-50" />
        <p>No transcript segments found</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="space-y-4 p-6">
        {segments.map((segment, index) => {
          const isActive = isActiveSegment(segment);
          
          return (
            <motion.div
              key={segment.id}
              ref={isActive ? activeSegmentRef : undefined}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex space-x-4 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                isActive ? 'bg-blue-50 ring-1 ring-blue-200' : ''
              }`}
              onClick={() => onSegmentClick(segment.start_sec)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                getAvatarColor(segment.speaker)
              }`}>
                {segment.speaker.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {segment.speaker}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {formatTime(segment.start_sec)}
                  </span>
                  {segment.confidence < 0.8 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Low confidence
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {segment.text}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};