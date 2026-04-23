import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Booking } from '../types/booking';

interface AdminDatePickerProps {
  bookings: Booking[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  excludeBookingId?: number; // Exclude the booking being edited from availability calculations
  originalBookingDate?: string; // The original saved booking date to highlight
}

const AdminDatePicker: React.FC<AdminDatePickerProps> = ({
  bookings,
  selectedDate,
  onSelectDate,
  excludeBookingId,
  originalBookingDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize with the selected date's month or current month
    if (selectedDate) {
      return new Date(selectedDate + 'T00:00:00');
    }
    return new Date();
  });

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (day: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isWeekend = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
  };

  const getTimeValue = (timeString: string) => {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return hour24 * 60 + minutes;
  };

  const hasMinimumConsecutiveHours = (dateString: string, availableSlots: number[]) => {
    if (availableSlots.length < 2) return false;
    
    // Sort available slots
    const sortedSlots = [...availableSlots].sort((a, b) => a - b);
    
    // 7 PM is 19:00 (1140 minutes from midnight)
    const maxEndTime = getTimeValue('7:00 PM');
    
    // Check for at least 2 consecutive hours that end by 7 PM
    for (let i = 0; i < sortedSlots.length; i++) {
      const startTime = sortedSlots[i];
      
      // Check if we can fit a 2-hour booking starting from this slot
      if (startTime + 120 <= maxEndTime) {
        // Check if the next hour is also available
        if (sortedSlots.includes(startTime + 60)) {
          return true;
        }
      }
    }
    
    return false;
  };

  const getDayBookingStatus = (day: number | null) => {
    if (!day) return 'empty';
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (date < today) return 'past';
    
    const dateString = formatDate(day);
    const dayBookings = bookings.filter(booking => 
      booking.date === dateString && 
      booking.status !== 'cancelled' &&
      booking.id !== excludeBookingId // Exclude the booking being edited
    );
    
    // Create array of all possible time slots in minutes
    const allTimeSlots = timeSlots.map(slot => getTimeValue(slot));
    const bookedSlots = new Set<number>();
    
    // Mark all booked time slots (including pending bookings)
    dayBookings.forEach(booking => {
      const startTime = getTimeValue(booking.startTime);
      const endTime = getTimeValue(booking.endTime);
      
      // Mark all slots from start to end as booked
      for (let time = startTime; time < endTime; time += 60) {
        bookedSlots.add(time);
      }
    });
    
    // Get available slots
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.has(slot));
    
    if (availableSlots.length === 0) return 'fully-booked';
    
    // Check if there are at least 2 consecutive hours available that end by 7 PM
    if (!hasMinimumConsecutiveHours(dateString, availableSlots)) {
      return 'fully-booked'; // Not enough consecutive time for minimum booking
    }
    
    if (availableSlots.length < allTimeSlots.length) return 'partially-booked';
    
    return 'available';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const handleDateClick = (day: number) => {
    const dateString = formatDate(day);
    const status = getDayBookingStatus(day);
    
    // Allow selection of any day that's not in the past
    if (status !== 'past') {
      onSelectDate(dateString);
    }
  };

  return (
    <div className="win95-panel p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="win95-button p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h4 className="text-lg font-semibold text-win95-black font-win95">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="win95-button p-2"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-win95-black font-win95 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentMonth).map((day, index) => {
          const isSelected = day && selectedDate === formatDate(day);
          const isOriginal = day && originalBookingDate === formatDate(day) && !isSelected;
          const bookingStatus = getDayBookingStatus(day);
          
          let buttonClasses = 'aspect-square p-2 text-sm font-medium relative min-h-[40px] flex items-center justify-center font-win95 ';
          let isClickable = false;
          
          if (!day) {
            buttonClasses += '';
          } else {
            // Handle original booking date styling
            if (isOriginal) {
              buttonClasses += 'win95-button cursor-pointer ';
              isClickable = true;
            } else {
            switch (bookingStatus) {
              case 'available':
                isClickable = true;
                buttonClasses += isSelected
                  ? 'bg-win95-blue text-white'
                  : 'win95-button cursor-pointer';
                break;
              case 'partially-booked':
                isClickable = true;
                buttonClasses += isSelected
                  ? 'bg-win95-blue text-white'
                  : 'win95-button cursor-pointer';
                break;
              case 'fully-booked':
                isClickable = true; // Still allow selection for admin to see what's booked
                buttonClasses += isSelected
                  ? 'bg-win95-blue text-white'
                  : 'win95-button cursor-pointer';
                break;
              case 'past':
                buttonClasses += 'text-win95-gray-dark cursor-not-allowed bg-win95-gray-light';
                break;
            }
            }
          }
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (day && isClickable) {
                  handleDateClick(day);
                }
              }}
              disabled={!day || !isClickable}
              className={buttonClasses}
            >
              {day}
              {day && (
                <>
                  {bookingStatus === 'available' && (
                    <CheckCircle className="absolute top-0.5 right-0.5 h-3 w-3 text-win95-green" />
                  )}
                  {bookingStatus === 'partially-booked' && (
                    <AlertTriangle className="absolute top-0.5 right-0.5 h-3 w-3 text-win95-yellow" />
                  )}
                  {bookingStatus === 'fully-booked' && (
                    <X className="absolute top-0.5 right-0.5 h-3 w-3 text-win95-red" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-xs text-win95-black font-win95 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-win95-gray border border-win95-gray-dark" />
          <span>Original Booking Date</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-win95-green" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-win95-yellow" />
          <span>Partially Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <X className="h-3 w-3 text-win95-red" />
          <span>Fully Booked</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDatePicker;