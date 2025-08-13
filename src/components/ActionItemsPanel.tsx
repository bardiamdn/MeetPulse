import React from 'react';
import { Check, Plus, Clock, AlertCircle, Flag, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActionItem } from '../lib/supabase';

interface ActionItemsPanelProps {
  actionItems: ActionItem[];
  onToggleComplete: (actionItem: ActionItem) => void;
  onAddTask: (initialText?: string) => void;
  onEditTask: (actionItem: ActionItem) => void;
}

export const ActionItemsPanel: React.FC<ActionItemsPanelProps> = ({
  actionItems,
  onToggleComplete,
  onAddTask,
  onEditTask
}) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Flag size={12} className="text-red-500" />;
      case 'medium':
        return <AlertCircle size={12} className="text-orange-500" />;
      default:
        return <Clock size={12} className="text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Action Items</h2>
        <button
          onClick={() => onAddTask()}
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors text-sm"
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>

      <div className="space-y-3">
        {actionItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
              item.completed
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <button
                onClick={() => onToggleComplete(item)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  item.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {item.completed && <Check size={12} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-all ${
                  item.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-900'
                }`}>
                  {item.text}
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  {item.owner && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {item.owner}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${
                    getPriorityColor(item.priority)
                  }`}>
                    {getPriorityIcon(item.priority)}
                    <span className="capitalize">{item.priority}</span>
                  </span>
                </div>
                
                {item.due_date && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(item);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                  title="Edit task"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {actionItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No action items found</p>
            <p className="text-xs text-gray-400">AI will extract tasks from your meeting</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
                  <div className="flex items-center space-x-2">
                    {item.owner && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {item.owner}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${
                      getPriorityColor(item.priority)
                    }`}>
                      {getPriorityIcon(item.priority)}
                      <span className="capitalize">{item.priority}</span>
                    </span>
                  </div>
                  
                  {item.due_date && (
                    <span className="text-xs text-gray-500">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {actionItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No action items found</p>
            <p className="text-xs text-gray-400">AI will extract tasks from your meeting</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};