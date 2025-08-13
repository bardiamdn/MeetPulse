import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Speaker, ActionItem } from '../lib/supabase';
import toast from 'react-hot-toast';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  initialText?: string;
  editingTask?: ActionItem | null;
  speakers: Speaker[];
  onTaskCreated: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  initialText = '',
  editingTask = null,
  speakers,
  onTaskCreated,
  onTaskUpdated
}) => {
  const [text, setText] = useState(initialText);
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load editing task data
  useEffect(() => {
    if (editingTask) {
      setText(editingTask.text);
      setOwner(editingTask.owner || '');
      setDueDate(editingTask.due_date || '');
      setPriority(editingTask.priority);
    } else {
      setText(initialText);
      setOwner('');
      setDueDate('');
      setPriority('medium');
    }
  }, [editingTask, initialText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    setIsLoading(true);

    try {
      if (editingTask) {
        // Update existing task
        const { data, error } = await supabase
          .from('action_items')
          .update({
            text: text.trim(),
            owner: owner.trim() || null,
            due_date: dueDate || null,
            priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTask.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        toast.success('Task updated successfully!');
        onTaskUpdated?.(data);
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('action_items')
          .insert({
            analysis_id: analysisId,
            text: text.trim(),
            owner: owner.trim() || null,
            due_date: dueDate || null,
            priority,
            confidence: 1.0, // User-created tasks have full confidence
            completed: false
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        toast.success('Task created successfully!');
        onTaskCreated(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTask ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Description *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter task description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <div className="relative" onBlur={() => setTimeout(() => setShowDropdown(false), 150)}>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Enter person's name or select from dropdown..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              
              {showDropdown && speakers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {speakers.map((speaker) => (
                    <button
                      key={speaker.name}
                      type="button"
                      onClick={() => {
                        setOwner(speaker.name);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {speaker.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900">{speaker.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-1 ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : p === 'medium'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } border`}
                >
                  {p === 'high' && <Flag size={12} />}
                  {p === 'medium' && <Clock size={12} />}
                  {p === 'low' && <Clock size={12} />}
                  <span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (editingTask ? 'Updating...' : 'Creating...') 
                : (editingTask ? 'Update Task' : 'Create Task')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};