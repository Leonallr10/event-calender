import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Type, AlignLeft, Repeat, Palette, AlertTriangle } from 'lucide-react';
import { Event, EventCategory } from '../types/Event';
import { format } from 'date-fns';

interface Recurrence {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek: number[];
  endDate: string;
}

interface FormData {
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  category: string;
  color: string;
  recurrence: Recurrence;
  updateMode?: 'single' | 'all';
}

interface EventModalProps {
  event?: Event | null;
  initialDate?: string;
  categories: EventCategory[];
  onSave: (event: Omit<Event, 'id'> & { updateMode?: 'single' | 'all' }) => void;
  onDelete?: (id: string, updateMode?: 'single' | 'all') => void;
  onClose: () => void;
  onCheckConflicts: (event: Event) => Event[];
  onDuplicate?: (event: Event) => void;
  onRecurrenceChange?: (event: Event, recurrence: Recurrence) => void;
}

const EventModal: React.FC<EventModalProps> = ({ 
  event, 
  initialDate, 
  categories, 
  onSave, 
  onDelete, 
  onClose,
  onCheckConflicts,
  onDuplicate,
  onRecurrenceChange
}) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    date: string;
    time: string;
    endTime: string;
    category: string;
    color: string;
    updateMode: 'single' | 'all';
    recurrence: {
      type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
      interval: number;
      daysOfWeek: number[];
      endDate: string;
    };
  }>({
    title: '',
    description: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    endTime: '',
    category: 'work',
    color: '#3B82F6',
    recurrence: {
      type: 'none',
      interval: 1,
      daysOfWeek: [],
      endDate: ''
    },
    updateMode: 'all'
  });

  const [conflicts, setConflicts] = useState<Event[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        endTime: event.endTime || '',
        category: event.category,
        color: event.color,
        updateMode: 'all',
        recurrence: event.recurrence ? {
          type: event.recurrence.type,
          interval: event.recurrence.interval || 1,
          daysOfWeek: event.recurrence.daysOfWeek || [],
          endDate: event.recurrence.endDate || ''
        } : {
          type: 'none',
          interval: 1,
          daysOfWeek: [],
          endDate: ''
        }
      });
    } else if (initialDate) {
      // For new events, set initial data and check conflicts
      setFormData(prev => ({
        ...prev,
        date: initialDate
      }));
    }

    // Check for initial conflicts
    const checkInitialConflicts = async () => {
      if (!formData.time) return;

      setIsCheckingConflicts(true);
      const eventToCheck = {
        ...formData,
        id: event?.id || 'new-event',
      } as Event;

      const conflictingEvents = onCheckConflicts(eventToCheck);
      setConflicts(conflictingEvents);
      setIsCheckingConflicts(false);
    };

    checkInitialConflicts();
  }, [event, initialDate]);

  // Check for conflicts when date, time, or endTime changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!formData.time) return;

      setIsCheckingConflicts(true);
      const eventToCheck = {
        ...formData,
        id: event?.id || 'new',
      } as Event;

      const conflictingEvents = onCheckConflicts(eventToCheck);
      setConflicts(conflictingEvents);
      setIsCheckingConflicts(false);
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Debounce conflict checking
    return () => clearTimeout(timeoutId);
  }, [formData.date, formData.time, formData.endTime, event?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData: Omit<Event, 'id'> & { updateMode?: 'single' | 'all' } = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      endTime: formData.endTime || undefined,
      category: formData.category,
      color: formData.color,
      recurrence: formData.recurrence.type === 'none' ? undefined : formData.recurrence,
      updateMode: event?.recurrence?.type !== 'none' ? formData.updateMode : undefined
    };

    // Check for conflicts one final time before saving
    const finalCheck = onCheckConflicts({ ...eventData, id: event?.id || 'new' } as Event);
    if (finalCheck.length > 0) {
      setConflicts(finalCheck);
      return; // Prevent saving if there are conflicts
    }

    onSave(eventData);
  };

  const handleDelete = () => {
    if (event && onDelete) {
      // Check if this is a recurring event
      const isRecurring = event.recurrence && event.recurrence.type !== 'none';
      const isRecurringInstance = event.isRecurringInstance || event.id.includes('-');
      
      if (isRecurring || isRecurringInstance) {
        onDelete(event.id, formData.updateMode);
      } else {
        onDelete(event.id);
      }
    }
  };

  const handleRecurrenceTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        type: type as any,
        daysOfWeek: type === 'weekly' ? [new Date(prev.date).getDay()] : []
      }
    }));
  };

  const handleDayOfWeekToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        daysOfWeek: prev.recurrence.daysOfWeek.includes(day)
          ? prev.recurrence.daysOfWeek.filter(d => d !== day)
          : [...prev.recurrence.daysOfWeek, day]
      }
    }));
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white w-full sm:rounded-xl shadow-xl sm:w-full sm:max-w-2xl h-full sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {event ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Type className="w-4 h-4" />
                Event Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <AlignLeft className="w-4 h-4" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Palette className="w-4 h-4" />
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      category: category.id, 
                      color: category.color 
                    }))}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      formData.category === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Update Mode for Recurring Events */}
            {event && ((event.recurrence && event.recurrence.type !== 'none') || event.isRecurringInstance || event.id.includes('-')) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="text-sm font-medium text-blue-800 mb-3 block">
                  Update Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="updateMode"
                      value="single"
                      checked={formData.updateMode === 'single'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        updateMode: e.target.value as 'single' | 'all'
                      }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-800">Update only this occurrence</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="updateMode"
                      value="all"
                      checked={formData.updateMode === 'all'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        updateMode: e.target.value as 'single' | 'all'
                      }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-800">Update all occurrences</span>
                  </label>
                </div>
              </div>
            )}

            {/* Recurrence */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Repeat className="w-4 h-4" />
                Recurrence
              </label>
              <div className="space-y-4">
                <select
                  value={formData.recurrence.type}
                  onChange={(e) => handleRecurrenceTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">No Recurrence</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>

                {formData.recurrence.type === 'weekly' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Repeat on days:
                    </label>
                    <div className="flex gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayOfWeekToggle(index)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            formData.recurrence.daysOfWeek.includes(index)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.recurrence.type === 'custom' || formData.recurrence.type === 'daily') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Repeat every:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.recurrence.interval}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurrence: { ...prev.recurrence, interval: parseInt(e.target.value) }
                        }))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-700">
                        {formData.recurrence.type === 'custom' ? 'days' : 'day(s)'}
                      </span>
                    </div>
                  </div>
                )}

                {formData.recurrence.type !== 'none' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      End recurrence (optional):
                    </label>
                    <input
                      type="date"
                      value={formData.recurrence.endDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurrence: { ...prev.recurrence, endDate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Conflicts Warning */}
            {isCheckingConflicts && (
              <div className="flex items-center gap-2 text-blue-600 p-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Checking for conflicts...</span>
              </div>
            )}
            {!isCheckingConflicts && conflicts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 animate-bounce" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      ⚠️ Scheduling Conflicts Detected
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This event conflicts with the following events:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      {conflicts.map(conflict => (
                        <li key={conflict.id} className="flex items-center gap-2 bg-yellow-100/50 p-2 rounded">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: conflict.color }}
                          />
                          <span className="font-medium">{conflict.title}</span>
                          <span className="text-yellow-800">
                            at {conflict.time}{conflict.endTime ? ` - ${conflict.endTime}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-yellow-700 mt-3 font-medium">
                      Please choose a different time or date to proceed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 mt-6">
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 p-4 sm:pt-6">
              <div>
                {event && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation text-base sm:text-sm"
                  >
                    Delete Event
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation text-base sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCheckingConflicts || conflicts.length > 0}
                  className={`px-6 py-3 sm:py-2 rounded-lg transition-colors touch-manipulation text-base sm:text-sm ${
                    isCheckingConflicts || conflicts.length > 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {event ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;