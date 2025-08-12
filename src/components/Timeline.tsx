import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '../lib/supabase';

interface TimelineProps {
  events: TimelineEvent[];
  onEventClick: (timestamp: number) => void;
  currentTimestamp: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  onEventClick,
  currentTimestamp
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative flex items-start space-x-4 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-all ${
                Math.abs(currentTimestamp - event.time) < 10 ? 'bg-blue-50' : ''
              }`}
              onClick={() => onEventClick(event.time)}
            >
              {/* Timeline node */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                Math.abs(currentTimestamp - event.time) < 10
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-300 group-hover:border-blue-400'
              }`}>
                <Clock size={12} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    {formatTime(event.time)}
                  </span>
                  <div
                    className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                    style={{
                      opacity: event.importance
                    }}
                  ></div>
                </div>
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                  {event.title}
                </h4>
                {event.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};