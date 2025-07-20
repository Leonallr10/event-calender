import React from 'react';
import { Clock } from 'lucide-react';
import { Event, EventCategory } from '../types/Event';

interface EventCardProps {
  event: Event;
  category?: EventCategory;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, category, onClick, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group relative p-1 sm:p-2 rounded-md text-[10px] sm:text-xs cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 touch-manipulation"
      style={{ backgroundColor: category?.color || '#6B7280' }}
    >
      <div className="text-white font-medium truncate max-w-[95%]">
        {event.title}
      </div>
      {event.time && window.innerWidth >= 640 && (
        <div className="hidden sm:flex items-center gap-1 text-white/80 mt-1">
          <Clock className="w-3 h-3" />
          <span>{event.time}</span>
        </div>
      )}
      {event.recurrence && event.recurrence.type !== 'none' && (
        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full flex items-center justify-center">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default EventCard;