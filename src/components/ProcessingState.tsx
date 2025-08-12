import React from 'react';
import { Loader2, Mic, Brain, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProcessingStateProps {
  status: 'processing' | 'ready' | 'failed';
  progress?: number;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ status, progress = 0 }) => {
  if (status === 'ready') {
    return null;
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Failed</h2>
          <p className="text-gray-600 mb-6">
            We encountered an error while processing your audio. Please try uploading again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { icon: Mic, label: 'Transcribing Audio', complete: progress > 33 },
    { icon: Brain, label: 'Analyzing Content', complete: progress > 66 },
    { icon: CheckCircle, label: 'Finalizing Results', complete: progress > 90 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Loader2 size={32} className="text-blue-600" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Meeting</h2>
          <p className="text-gray-600">
            Our AI is transcribing and analyzing your audio. This may take a few minutes.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = progress > (index * 33);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.complete 
                    ? 'bg-green-100 text-green-600'
                    : isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.complete ? (
                    <CheckCircle size={16} />
                  ) : (
                    <StepIcon size={16} className={isActive ? 'animate-pulse' : ''} />
                  )}
                </div>
                <span className={`font-medium ${
                  step.complete
                    ? 'text-green-700'
                    : isActive
                    ? 'text-blue-700'
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-blue-600 h-2 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};