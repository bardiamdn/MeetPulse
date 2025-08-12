import React from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  summary: string;
  confidence: number;
  onCreateTask: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  confidence,
  onCreateTask
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
        <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
          <TrendingUp size={12} />
          <span>Confidence: {Math.round(confidence * 100)}%</span>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {summary}
      </p>
      
      <button
        onClick={onCreateTask}
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
      >
        <Plus size={14} />
        <span>Create task from summary</span>
      </button>
    </motion.div>
  );
};