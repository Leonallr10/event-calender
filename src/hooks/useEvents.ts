import { useState, useEffect } from 'react';
import { Event, EventCategory } from '../types/Event';
import { 
  addDays, 
  addWeeks, 
  addMonths,
  addHours,
  parseISO, 
  format
} from 'date-fns';

const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'work', name: 'Work', color: '#3B82F6' },
  { id: 'personal', name: 'Personal', color: '#10B981' },
  { id: 'meeting', name: 'Meeting', color: '#8B5CF6' },
  { id: 'appointment', name: 'Appointment', color: '#F59E0B' },
  { id: 'social', name: 'Social', color: '#EF4444' },
  { id: 'other', name: 'Other', color: '#6B7280' }
];

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories] = useState<EventCategory[]>(DEFAULT_CATEGORIES);

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar-events');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error('Failed to parse saved events:', error);
      }
    }
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('calendar-events', JSON.stringify(events));
  }, [events]);

  const generateRecurringEvents = (event: Event, startDate: Date, endDate: Date): Event[] => {
    if (!event.recurrence || event.recurrence.type === 'none') {
      return [event];
    }

    const recurringEvents: Event[] = [];
    const eventDate = parseISO(event.date);
    let currentDate = new Date(eventDate);
    
    const endRecurrence = event.recurrence.endDate ? parseISO(event.recurrence.endDate) : endDate;
    
    while (currentDate <= endRecurrence && currentDate <= endDate) {
      if (currentDate >= startDate) {
        recurringEvents.push({
          ...event,
          id: `${event.id}-${format(currentDate, 'yyyy-MM-dd')}`,
          date: format(currentDate, 'yyyy-MM-dd'),
          originalDate: event.date
        });
      }

      switch (event.recurrence.type) {
        case 'daily':
          currentDate = addDays(currentDate, event.recurrence.interval || 1);
          break;
        case 'weekly':
          if (event.recurrence.daysOfWeek && event.recurrence.daysOfWeek.length > 0) {
            // Find next occurrence on specified days
            let nextDate = addDays(currentDate, 1);
            while (!event.recurrence.daysOfWeek.includes(nextDate.getDay())) {
              nextDate = addDays(nextDate, 1);
            }
            currentDate = nextDate;
          } else {
            currentDate = addWeeks(currentDate, event.recurrence.interval || 1);
          }
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, event.recurrence.interval || 1);
          break;
        case 'custom':
          currentDate = addDays(currentDate, event.recurrence.interval || 1);
          break;
        default:
          return recurringEvents;
      }
    }

    return recurringEvents;
  };

  const getEventsForDateRange = (startDate: Date, endDate: Date): Event[] => {
    const allEvents: Event[] = [];
    
    events.forEach(event => {
      const eventDate = parseISO(event.date);
      
      if (eventDate >= startDate && eventDate <= endDate) {
        if (event.recurrence && event.recurrence.type !== 'none') {
          const recurringEvents = generateRecurringEvents(event, startDate, endDate);
          allEvents.push(...recurringEvents);
        } else {
          allEvents.push(event);
        }
      } else if (event.recurrence && event.recurrence.type !== 'none') {
        const recurringEvents = generateRecurringEvents(event, startDate, endDate);
        allEvents.push(...recurringEvents);
      }
    });

    return allEvents;
  };

  const getEventsForDate = (date: Date): Event[] => {
    return getEventsForDateRange(date, date);
  };

  const addEvent = (event: Omit<Event, 'id'>): Event => {
    // Check for conflicts before adding
    const tempEvent = {
      ...event,
      id: 'temp-' + Date.now().toString()
    } as Event;

    const conflicts = checkConflicts(tempEvent);
    if (conflicts.length > 0) {
      throw new Error('Cannot create event due to conflicts');
    }

    // No conflicts, create the event
    const newEvent: Event = {
      ...event,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<Event>): void => {
    // First, get the existing event
    const existingEvent = events.find(e => e.id === id);
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    // Create a temporary updated event to check for conflicts
    const tempEvent = {
      ...existingEvent,
      ...updates,
    } as Event;

    // Check for conflicts, excluding the current event being updated
    const conflicts = checkConflicts(tempEvent);
    if (conflicts.length > 0) {
      throw new Error('Cannot update event due to conflicts');
    }

    // No conflicts, update the event
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
  };

  const deleteEvent = (id: string): void => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const moveEvent = (id: string, newDate: string): void => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, date: newDate } : event
    ));
  };

  const checkConflicts = (event: Event): Event[] => {
    const eventDate = parseISO(event.date);
    const eventsOnSameDay = getEventsForDate(eventDate);
    
    return eventsOnSameDay.filter(e => {
      // Skip comparing with itself
      if (e.id === event.id) return false;
      
      // If either event doesn't have a time, treat it as an all-day event
      if (!e.time || !event.time) {
        return true; // All-day events conflict with everything on the same day
      }
      
      // Parse event times
      const eStart = parseISO(`${e.date}T${e.time}`);
      const eventStart = parseISO(`${event.date}T${event.time}`);
      
      // Set end times (if not specified, use start time plus 1 hour)
      const eEnd = e.endTime 
        ? parseISO(`${e.date}T${e.endTime}`)
        : addHours(eStart, 1);
      const eventEnd = event.endTime 
        ? parseISO(`${event.date}T${event.endTime}`)
        : addHours(eventStart, 1);
      
      // Check if the events overlap
      const hasOverlap = (
        // New event starts during existing event
        (eventStart >= eStart && eventStart < eEnd) ||
        // New event ends during existing event
        (eventEnd > eStart && eventEnd <= eEnd) ||
        // New event completely contains existing event
        (eventStart <= eStart && eventEnd >= eEnd) ||
        // Events start at exactly the same time
        eventStart.getTime() === eStart.getTime()
      );
      
      return hasOverlap;
    });
  };

  return {
    events,
    categories,
    getEventsForDate,
    getEventsForDateRange,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    checkConflicts
  };
};