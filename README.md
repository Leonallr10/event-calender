# Frontend Assignment

## Assignment: Custom Event Calendar

### **Objective**

The goal of this assignment is to build a dynamic, interactive event calendar that allows users to manage their schedule. Users should be able to add, edit, delete, and view events. The calendar should also support recurring events, and users should be able to drag and drop events to reschedule them.

---

### **Features to Implement**

#### 1. Monthly View Calendar
- Display a traditional monthly calendar view.
- Highlight the current day.
- Allow users to navigate between months.

#### 2. Event Management
- **Add Event:**
  - Users can add events by clicking on a specific day.
  - Event form fields:
    - Event Title
    - Date and Time (with time picker)
    - Description
    - Recurrence options (e.g., Daily, Weekly, Monthly, Custom)
    - Event color or category (optional)
- **Edit Event:**
  - Users can click an event to edit.
  - Update any event details.
- **Delete Event:**
  - Option to delete events from the calendar view or event form.

#### 3. Recurring Events
- Support for recurrence options:
  - **Daily**: Repeat every day.
  - **Weekly**: Repeat on selected weekdays.
  - **Monthly**: Repeat on a specific day each month.
  - **Custom**: Custom recurrence pattern (e.g., every 2 weeks).
- Display recurring events on all applicable dates.

#### 4. Drag-and-Drop Rescheduling
- Users can drag events to reschedule.
- Handle edge cases like overlapping or conflicting events.

#### 5. Event Conflict Management
- Prevent or warn about overlapping events.
- Show clear feedback on conflicts.

#### 6. Event Filtering and Searching (Optional)
- Filter by category or search by title/description.
- Dynamic search bar with real-time filtering.

#### 7. Event Persistence
- Use local storage or IndexedDB for data persistence.
- Events remain after page refresh or navigation.

#### 8. Responsive Design (Optional)
- Works well on all screen sizes including mobile.
- Adjust layout for smaller screens (e.g., weekly/daily view).

---

### **Technical Requirements**

- **Framework/Library**: Use React, Vue.js, or Angular.
- **State Management**: Effective management for complex operations (e.g., Context API, Redux, Vuex).
- **Date Handling**: Use libraries like Moment.js or date-fns.
- **Drag-and-Drop**: Use React DnD, interact.js, or a custom solution.

---

### **Evaluation Criteria**

- **Functionality**: Meets all feature requirements and edge cases.
- **Code Quality**: Clean, modular, and follows best practices.
- **User Experience**: Intuitive design and responsive feedback.
- **Performance**: Efficient with large numbers of events or patterns.
- **Bonus**: Additional features like weekly view or Google Calendar integration.

---

### **Deliverables**

- GitHub repository link with source code.
- README with setup and usage instructions.
- Live demo link (GitHub Pages, Netlify, or Vercel preferred).
