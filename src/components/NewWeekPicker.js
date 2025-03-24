// import React, { useState, useEffect } from 'react';
// import format from 'date-fns/format';
// import startOfWeek from 'date-fns/startOfWeek';
// import endOfWeek from 'date-fns/endOfWeek';
// import addWeeks from 'date-fns/addWeeks';
// import subWeeks from 'date-fns/subWeeks';
// import DatePicker from 'react-datepicker';
// import './WeekPicker.css';
// import "react-datepicker/dist/react-datepicker.css";

// const WeekPicker = () => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [isPickerOpen, setIsPickerOpen] = useState(false);

//   const startDate = startOfWeek(currentDate || new Date(), { weekStartsOn: 1 });
//   const endDate = endOfWeek(currentDate || new Date(), { weekStartsOn: 1 });

//   useEffect(() => {
//     const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
//     const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
//   }, []);

//   const handlePreviousWeek = () => {
//     const newDate = subWeeks(currentDate, 1);
//     setCurrentDate(newDate);
//     const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
//     const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
//   };

//   const handleNextWeek = () => {
//     const newDate = addWeeks(currentDate, 1);
//     setCurrentDate(newDate);
//     const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
//     const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
//   };

//   const handleDateSelect = (date) => {
//     if (date instanceof Date && !isNaN(date)) {
//       setCurrentDate(date);
//       setIsPickerOpen(false);
//       const newStartDate = startOfWeek(date, { weekStartsOn: 1 });
//       const newEndDate = endOfWeek(date, { weekStartsOn: 1 });
//     }
//   };

//   return (
//     <div className="week-picker-container">
//       <div className="week-picker">
//         <button onClick={handlePreviousWeek}>&lt;</button>
//         <div className="date-display">
//           <span onClick={() => setIsPickerOpen(!isPickerOpen)}>
//             {startDate && endDate ? 
//               `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}` :
//               'Select a date'
//             }
//           </span>
//         </div>
//         <button onClick={handleNextWeek}>&gt;</button>
//       </div>
//       {isPickerOpen && (
//         <div className="datepicker-container">
//           <DatePicker
//             selected={currentDate}
//             onChange={handleDateSelect}
//             onClickOutside={() => setIsPickerOpen(false)}
//             calendarStartDay={1}
//             inline
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default WeekPicker;

import React, { useState, useEffect } from 'react';
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import DatePicker from 'react-datepicker';
import './WeekPicker.css';
import "react-datepicker/dist/react-datepicker.css";

const WeekPicker = ({ onWeekChange, className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const handlePreviousWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    
    // Calculate new dates and notify parent
    const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
    const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
    
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
    const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
    const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
    
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
      const newStartDate = startOfWeek(date, { weekStartsOn: 1 });
      const newEndDate = endOfWeek(date, { weekStartsOn: 1 });
      
      if (onWeekChange) {
        console.log("Week changed by date picker:", {
          startDate: format(newStartDate, 'yyyy-MM-dd'),
          endDate: format(newEndDate, 'yyyy-MM-dd')
        });
        onWeekChange(newStartDate, newEndDate);
      }
    }
  };

  // Toggle calendar when clicking on the date range
  const toggleCalendar = () => {
    setIsPickerOpen(!isPickerOpen);
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
        
        <div 
          className="date-range"
          onClick={toggleCalendar}
        >
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

// import React, { useState, useEffect } from 'react';
// import format from 'date-fns/format';
// import startOfWeek from 'date-fns/startOfWeek';
// import endOfWeek from 'date-fns/endOfWeek';
// import addWeeks from 'date-fns/addWeeks';
// import subWeeks from 'date-fns/subWeeks';
// import DatePicker from 'react-datepicker';
// import './WeekPicker.css';
// import "react-datepicker/dist/react-datepicker.css";

// const WeekPicker = ({ onWeekChange, className = '' }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [isPickerOpen, setIsPickerOpen] = useState(false);
  
//   // Calculate start and end dates based on current date
//   // Using weekStartsOn as 1 (Monday) as per requirements
//   const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
//   const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

//   // Initial setup - call onWeekChange once on mount
//   useEffect(() => {
//     if (onWeekChange) {
//       console.log("WeekPicker - Initial dates:", {
//         startDate: format(startDate, 'yyyy-MM-dd'),
//         endDate: format(endDate, 'yyyy-MM-dd')
//       });
      
//       onWeekChange(startDate, endDate);
//     }
//   }, []); // Empty dependency array - run only once on mount

//   const handlePreviousWeek = () => {
//     const newDate = subWeeks(currentDate, 1);
//     setCurrentDate(newDate);
    
//     // Calculate new dates and notify parent
//     const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
//     const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
    
//     if (onWeekChange) {
//       console.log("Week changed to previous:", {
//         startDate: format(newStartDate, 'yyyy-MM-dd'),
//         endDate: format(newEndDate, 'yyyy-MM-dd')
//       });
//       onWeekChange(newStartDate, newEndDate);
//     }
//   };

//   const handleNextWeek = () => {
//     const newDate = addWeeks(currentDate, 1);
//     setCurrentDate(newDate);
    
//     // Calculate new dates and notify parent
//     const newStartDate = startOfWeek(newDate, { weekStartsOn: 1 });
//     const newEndDate = endOfWeek(newDate, { weekStartsOn: 1 });
    
//     if (onWeekChange) {
//       console.log("Week changed to next:", {
//         startDate: format(newStartDate, 'yyyy-MM-dd'),
//         endDate: format(newEndDate, 'yyyy-MM-dd')
//       });
//       onWeekChange(newStartDate, newEndDate);
//     }
//   };

//   const handleDateSelect = (date) => {
//     if (date instanceof Date && !isNaN(date)) {
//       setCurrentDate(date);
//       setIsPickerOpen(false);
      
//       // Calculate new dates and notify parent
//       const newStartDate = startOfWeek(date, { weekStartsOn: 1 });
//       const newEndDate = endOfWeek(date, { weekStartsOn: 1 });
      
//       if (onWeekChange) {
//         console.log("Week changed by date picker:", {
//           startDate: format(newStartDate, 'yyyy-MM-dd'),
//           endDate: format(newEndDate, 'yyyy-MM-dd')
//         });
//         onWeekChange(newStartDate, newEndDate);
//       }
//     }
//   };

//   // Ensure we don't have duplicate classes 
//   const containerClasses = className ? `week-picker-container ${className}` : 'week-picker-container';

//   return (
//     <div className={containerClasses}>
//       <div className="week-picker">
//         <button onClick={handlePreviousWeek} type="button" aria-label="Previous week">&lt;</button>
//         <div className="date-display">
//           <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
//         </div>
//         <button onClick={handleNextWeek} type="button" aria-label="Next week">&gt;</button>
//       </div>
//       {isPickerOpen && (
//         <div className="datepicker-container">
//           <DatePicker
//             selected={currentDate}
//             onChange={handleDateSelect}
//             onClickOutside={() => setIsPickerOpen(false)}
//             showWeekNumbers
//             calendarStartDay={1}
//             inline
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default WeekPicker;