export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  endTime?: string; // HH:mm format
  category: string;
  color: string;
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number; // for custom recurrence
    daysOfWeek?: number[]; // for weekly recurrence (0-6, Sunday-Saturday)
    endDate?: string; // when to stop recurring
  };
  originalDate?: string; // for tracking moved recurring events
  parentId?: string; // for recurring event instances, points to the master event
  isRecurringInstance?: boolean; // true if this is an instance of a recurring event
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
}