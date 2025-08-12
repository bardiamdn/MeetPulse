import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { SentimentPoint } from '../lib/supabase';

interface SentimentChartProps {
  sentimentData: SentimentPoint[];
  onTimestampClick: (timestamp: number) => void;
}

export const SentimentChart: React.FC<SentimentChartProps> = ({
  sentimentData,
  onTimestampClick
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sentiment = payload[0].value;
      const emoticon = sentiment > 0.3 ? '😊' : sentiment < -0.3 ? '😞' : '😐';
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">
            {formatTime(label)} {emoticon}
          </p>
          <p className="text-sm text-gray-600">
            Sentiment: {(sentiment > 0 ? '+' : '') + (sentiment * 100).toFixed(0)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment</h2>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sentimentData}
            onClick={(data) => data && onTimestampClick(data.time)}
          >
            <XAxis 
              dataKey="time"
              tickFormatter={formatTime}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
            />
            <YAxis 
              domain={[-1, 1]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickFormatter={(value) => (value > 0 ? '+' : '') + (value * 100).toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              fill="url(#sentimentGradient)"
            />
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Negative</span>
        </span>
        <span className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>Neutral</span>
        </span>
        <span className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Positive</span>
        </span>
      </div>
    </motion.div>
  );
};