import React, { useState, useRef } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Search, Filter } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { Event } from '../types/Event';
import EventModal from './EventModal';
import EventCard from './EventCard';
import EventFilters from './EventFilters';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const dragCounter = useRef(0);

  const { categories, getEventsForDate, addEvent, updateEvent, deleteEvent, moveEvent, checkConflicts } = useEvents();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredEvents = (dayEvents: Event[]) => {
    return dayEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);
      return matchesSearch && matchesCategory;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (draggedEvent) {
      const newDate = format(targetDate, 'yyyy-MM-dd');
      const updatedEvent = { ...draggedEvent, date: newDate };
      
      // Check for conflicts
      const conflicts = checkConflicts(updatedEvent);
      if (conflicts.length > 0) {
        alert(`Conflict detected with: ${conflicts.map(c => c.title).join(', ')}`);
        return;
      }
      
      moveEvent(draggedEvent.id, newDate);
      setDraggedEvent(null);
    }
  };

  const handleEventSave = (eventData: Omit<Event, 'id'>) => {
    // Create a temporary event object to check for conflicts
    const tempEvent = {
      ...eventData,
      id: selectedEvent ? selectedEvent.id : 'temp-new-event'
    } as Event;

    try {
      // Check for conflicts
      const conflicts = checkConflicts(tempEvent);
      
      if (conflicts.length > 0) {
        // Don't save if there are conflicts - the modal will show the conflict warning
        return;
      }

      // No conflicts, proceed with save
      if (selectedEvent) {
        updateEvent(selectedEvent.id, eventData);
      } else {
        addEvent(eventData);
      }
      setIsModalOpen(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      alert('Failed to save event: ' + (error as Error).message);
    }
  };

  const handleEventDuplicate = (event: Event) => {
    try {
      const duplicateEvent: Omit<Event, 'id'> = {
        ...event,
        title: `${event.title} (Copy)`,
        date: format(new Date(), 'yyyy-MM-dd'),
        recurrence: undefined // Remove recurrence from duplicate
      };
      addEvent(duplicateEvent);
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      alert('Failed to duplicate event: ' + (error as Error).message);
    }
  };

  const handleRecurrenceChange = (event: Event, recurrence: any) => {
    try {
      updateEvent(event.id, { recurrence });
    } catch (error) {
      alert('Failed to update recurrence: ' + (error as Error).message);
    }
  };

  const handleEventDelete = (id: string) => {
    deleteEvent(id);
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Calendar</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <EventFilters
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
            />
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 min-w-[160px] sm:min-w-[200px] text-center">
                <span className={isSameMonth(currentDate, new Date()) ? 'text-blue-600' : ''}>
                  {format(currentDate, 'MMMM yyyy')}
                </span>
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-700 bg-gray-50">
                {day.slice(0, 1)}
                <span className="hidden sm:inline">{day.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const dayEvents = filteredEvents(getEventsForDate(day));
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`relative min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-gray-200 cursor-pointer transition-colors touch-manipulation ${
                    isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isCurrentDay ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}
                  onClick={() => handleDateClick(day)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className={`relative z-10 inline-flex items-center justify-center ${
                    isCurrentDay ? 'bg-blue-600 text-white rounded-full w-7 h-7' : ''
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isCurrentMonth ? (!isCurrentDay ? 'text-gray-900' : '') : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  {isCurrentDay && (
                    <div className="absolute top-0 right-0 mt-1 mr-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayEvents.slice(0, window.innerWidth < 640 ? 2 : 3).map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        onDragStart={(e) => handleDragStart(e, event)}
                        category={categories.find(c => c.id === event.category)}
                      />
                    ))}
                    {dayEvents.length > (window.innerWidth < 640 ? 2 : 3) && (
                      <div className="text-xs text-gray-500 px-1 sm:px-2">
                        +{dayEvents.length - (window.innerWidth < 640 ? 2 : 3)} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          initialDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
          categories={categories}
          onSave={handleEventSave}
          onDelete={selectedEvent ? handleEventDelete : undefined}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onCheckConflicts={checkConflicts}
          onDuplicate={handleEventDuplicate}
          onRecurrenceChange={handleRecurrenceChange}
        />
      )}
    </div>
  );
};

export default Calendar;