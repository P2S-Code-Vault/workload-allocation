import React, { useState, useEffect } from 'react';
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import DatePicker from 'react-datepicker';
import './WeekPicker.css';
import "react-datepicker/dist/react-datepicker.css";

const WeekPicker = ({ onWeekChange, className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  // Calculate start and end dates based on current date
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });

  // Initial setup - call onWeekChange once on mount
  useEffect(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
    
    console.log("WeekPicker - Initial dates:", {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    
    if (onWeekChange) {
      onWeekChange(startDate, endDate);
    }
  }, []);// Empty dependency array - run only once on mount

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    
    // Calculate new dates and notify parent
    const newStartDate = startOfWeek(newDate, { weekStartsOn: 0 });
    const newEndDate = endOfWeek(newDate, { weekStartsOn: 0 });
    
    if (onWeekChange) {
      console.log("Week changed to previous:", {
        startDate: format(newStartDate, 'yyyy-MM-dd'),
        endDate: format(newEndDate, 'yyyy-MM-dd')
      });
      onWeekChange(newStartDate, newEndDate);
    }
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(currentDate, 1);
    setCurrentDate(newDate);
    
    // Calculate new dates and notify parent
    const newStartDate = startOfWeek(newDate, { weekStartsOn: 0 });
    const newEndDate = endOfWeek(newDate, { weekStartsOn: 0 });
    
    if (onWeekChange) {
      console.log("Week changed to next:", {
        startDate: format(newStartDate, 'yyyy-MM-dd'),
        endDate: format(newEndDate, 'yyyy-MM-dd')
      });
      onWeekChange(newStartDate, newEndDate);
    }
  };

  const handleDateSelect = (date) => {
    if (date instanceof Date && !isNaN(date)) {
      setCurrentDate(date);
      setIsPickerOpen(false);
      
      // Calculate new dates and notify parent
      const newStartDate = startOfWeek(date, { weekStartsOn: 0 });
      const newEndDate = endOfWeek(date, { weekStartsOn: 0 });
      
      if (onWeekChange) {
        console.log("Week changed by date picker:", {
          startDate: format(newStartDate, 'yyyy-MM-dd'),
          endDate: format(newEndDate, 'yyyy-MM-dd')
        });
        onWeekChange(newStartDate, newEndDate);
      }
    }
  };

  const containerClass = `week-picker-container ${className || ''}`;

  return (
    <div className={containerClass}>
      <div className="week-picker">
        <button onClick={handlePreviousWeek} type="button" aria-label="Previous week">&lt;</button>
        <div className="date-display">
          <button 
            className="date-button" 
            onClick={() => setIsPickerOpen(!isPickerOpen)} 
            type="button"
          >
            {startDate && endDate ? 
              `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}` :
              'Select a date'
            }
          </button>
        </div>
        <button onClick={handleNextWeek} type="button" aria-label="Next week">&gt;</button>
      </div>
      {isPickerOpen && (
        <div className="datepicker-container">
          <DatePicker
            selected={currentDate}
            onChange={handleDateSelect}
            onClickOutside={() => setIsPickerOpen(false)}
            showWeekNumbers
            calendarStartDay={0}
            inline
          />
        </div>
      )}
    </div>
  );
};

export default WeekPicker;