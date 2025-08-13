import React from 'react';
import { X, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface RawTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawTranscript: any;
  meetingTitle: string;
}

export const RawTranscriptModal: React.FC<RawTranscriptModalProps> = ({
  isOpen,
  onClose,
  rawTranscript,
  meetingTitle
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (rawTranscript?.text) {
      navigator.clipboard.writeText(rawTranscript.text);
      toast.success('Raw transcript copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (!rawTranscript?.text) return;

    let content = `Raw Transcript - ${meetingTitle}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Language: ${rawTranscript.language || 'Unknown'}\n`;
    content += `Duration: ${rawTranscript.segments ? formatTime(rawTranscript.segments[rawTranscript.segments.length - 1]?.end || 0) : 'Unknown'}\n\n`;
    content += '--- FULL TRANSCRIPT ---\n\n';
    content += rawTranscript.text;

    if (rawTranscript.segments && rawTranscript.segments.length > 0) {
      content += '\n\n--- TIMESTAMPED SEGMENTS ---\n\n';
      rawTranscript.segments.forEach((segment: any, index: number) => {
        content += `[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${segment.text}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meetingTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-raw-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Raw transcript downloaded!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Raw Transcript</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2 text-sm"
              >
                <Copy size={16} />
                <span>Copy</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>
          
          {rawTranscript && (
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
              <span>Language: {rawTranscript.language || 'Unknown'}</span>
              {rawTranscript.segments && (
                <span>Segments: {rawTranscript.segments.length}</span>
              )}
              {rawTranscript.segments && rawTranscript.segments.length > 0 && (
                <span>Duration: {formatTime(rawTranscript.segments[rawTranscript.segments.length - 1]?.end || 0)}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {rawTranscript?.text ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Full Transcript</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {rawTranscript.text}
                    </p>
                  </div>
                </div>

                {rawTranscript.segments && rawTranscript.segments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Timestamped Segments</h3>
                    <div className="space-y-3">
                      {rawTranscript.segments.map((segment: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-600">
                              Segment {index + 1}
                            </span>
                            <span className="text-sm text-gray-500 font-mono">
                              {formatTime(segment.start)} - {formatTime(segment.end)}
                            </span>
                          </div>
                          <p className="text-gray-800 leading-relaxed">
                            {segment.text}
                          </p>
                          {segment.avg_logprob && (
                            <div className="mt-2 text-xs text-gray-500">
                              Confidence: {Math.round((1 + segment.avg_logprob) * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No raw transcript data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};