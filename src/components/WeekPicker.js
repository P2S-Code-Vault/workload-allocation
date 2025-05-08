import React, { useState, useEffect } from 'react';
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import DatePicker from 'react-datepicker';
import './WeekPicker.css';
import "react-datepicker/dist/react-datepicker.css";

const WeekPicker = ({ onWeekChange, className = '', hasUnsavedChanges = false, onSaveChanges = null }) => {
  // Initialize from localStorage or default to next week's date
  const [currentDate, setCurrentDate] = useState(() => {
    try {
      const storedDate = localStorage.getItem('selectedWeekDate');
      if (storedDate) {
        const parsedDate = new Date(storedDate);
        if (parsedDate instanceof Date && !isNaN(parsedDate)) {
          return parsedDate;
        }
      }
    } catch (e) {
      console.warn("Error reading date from localStorage:", e);
    }
    // Default to next week if no valid date in localStorage
    return addWeeks(new Date(), 1);
  });
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  // Calculate start and end dates based on current date
  // Using weekStartsOn as 1 (Monday) as per requirements
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Format the date range display string
  const dateRangeText = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;

  // Initial setup - call onWeekChange once on mount
  useEffect(() => {
    if (onWeekChange) {
      console.log("WeekPicker - Initial dates:", {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      onWeekChange(startDate, endDate);
    }
  }, []); // Empty dependency array - run only once on mount

  // Save to localStorage whenever currentDate changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedWeekDate', currentDate.toISOString());
    } catch (e) {
      console.warn("Error saving date to localStorage:", e);
    }
  }, [currentDate]);

  const handleWeekChange = (newDate) => {
    // Function to handle week change with confirmation
    if (hasUnsavedChanges && onSaveChanges) {
      if (window.confirm("You have unsaved changes. Press Ok to save them. Press Cancel to discard.")) {
        onSaveChanges(() => {
          // After saving, proceed with the week change
          setCurrentDate(newDate);
          const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
          const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
          if (onWeekChange) {
            onWeekChange(newStartDate, newEndDate);
          }
        });
      } else {
        // User chose not to save, just change the week
        setCurrentDate(newDate);
        const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
        const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
        if (onWeekChange) {
          onWeekChange(newStartDate, newEndDate);
        }
      }
    } else {
      // No unsaved changes or no save handler, just change the week
      setCurrentDate(newDate);
      const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
      const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
      if (onWeekChange) {
        onWeekChange(newStartDate, newEndDate);
      }
    }
  };

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    handleWeekChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentDate, 1);
    handleWeekChange(newDate);
  };

  const handleDateSelect = (date) => {
    if (date instanceof Date && !isNaN(date)) {
      setIsPickerOpen(false);
      handleWeekChange(date);
    }
  };

  // Ensure we don't have duplicate classes
  const containerClasses = className ? `week-picker-container ${className}` : 'week-picker-container';

  return (
    <div className={containerClasses}>
      <div className="week-picker">
        <button 
          onClick={handlePreviousWeek} 
          type="button" 
          aria-label="Previous week"
          className="nav-button"
        >
          &lt;
        </button>
        
        <div className="date-range">
          {dateRangeText}
        </div>
        
        <button 
          onClick={handleNextWeek} 
          type="button" 
          aria-label="Next week"
          className="nav-button"
        >
          &gt;
        </button>
      </div>
      
      {isPickerOpen && (
        <div className="datepicker-container">
          <DatePicker
            selected={currentDate}
            onChange={handleDateSelect}
            onClickOutside={() => setIsPickerOpen(false)}
            showWeekNumbers
            calendarStartDay={1}
            inline
          />
        </div>
      )}
    </div>
  );
};

export default WeekPicker;