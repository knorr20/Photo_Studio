import React, { useEffect } from 'react';
import { X, CreditCard as Edit } from 'lucide-react';
import { Booking } from '../types/booking';
import AdminDatePicker from './AdminDatePicker';
import { calculateDuration, calculatePrice, getTimeValue } from '../utils/bookingCalculations';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editableBooking: Booking | null;
  setEditableBooking: (booking: Booking | null) => void;
  originalBooking: Booking | null;
  onSave: () => void;
  bookings: Booking[];
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  editableBooking,
  setEditableBooking,
  originalBooking,
  onSave,
  bookings
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !editableBooking) return null;

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
  ];

  // Helper function to check if a time slot is booked by another booking
  const isTimeSlotBookedByOtherBooking = (timeSlot: string, date: string, currentBookingId: number): boolean => {
    const timeValue = getTimeValue(timeSlot);
    const dayBookings = bookings.filter(booking => 
      booking.date === date && 
      booking.status !== 'cancelled' &&
      booking.id !== currentBookingId // Exclude the booking being edited
    );
    
    // Check if this time slot conflicts with any existing booking
    return dayBookings.some(booking => {
      const startTime = getTimeValue(booking.startTime);
      const endTime = getTimeValue(booking.endTime);
      return timeValue >= startTime && timeValue < endTime;
    });
  };

  // Helper function to check if a time slot is part of the original booking
  const isTimeSlotPartOfOriginalBooking = (timeSlot: string, date: string, originalBooking: Booking | null): boolean => {
    if (!originalBooking) return false;
    
    // Only show as "original" if we're viewing the same date as the original booking
    if (date !== originalBooking.date) return false;
    
    const timeValue = getTimeValue(timeSlot);
    const originalStartTime = getTimeValue(originalBooking.startTime);
    const originalEndTime = getTimeValue(originalBooking.endTime);
    
    return timeValue >= originalStartTime && timeValue < originalEndTime;
  };

  // Helper function to get the display text and disabled state for a time slot
  const getTimeSlotInfo = (
    timeSlot: string, 
    date: string, 
    currentBookingId: number, 
    originalBooking: Booking | null,
    isForEndTime: boolean = false,
    selectedStartTime: string | null = null
  ) => {
    const isBooked = isTimeSlotBookedByOtherBooking(timeSlot, date, currentBookingId);
    const isOriginal = isTimeSlotPartOfOriginalBooking(timeSlot, date, originalBooking);
    
    let displayText = timeSlot;
    let isDisabled = false;
    
    // Check if this is for end time and validate against start time
    if (isForEndTime && selectedStartTime) {
      const timeValue = getTimeValue(timeSlot);
      const startTimeValue = getTimeValue(selectedStartTime);
      const maxEndTime = getTimeValue('7:00 PM'); // Studio closes at 7 PM
      
      if (timeValue <= startTimeValue) {
        displayText += ' (Must be after start)';
        isDisabled = true;
      } else if (timeValue > maxEndTime) {
        displayText += ' (Studio closes 7 PM)';
        isDisabled = true;
      } else if (isBooked) {
        displayText += ' (Booked)';
        isDisabled = true;
      } else if (isOriginal) {
        displayText += ' (Original)';
      }
    } else if (isBooked) {
      displayText += ' (Booked)';
      isDisabled = true;
    } else if (isOriginal) {
      displayText += ' (Original)';
    }
    
    return { displayText, isDisabled };
  };

  // Helper function to find the first valid end time after a given start time
  const findFirstValidEndTime = (startTime: string, date: string, currentBookingId: number, originalBooking: Booking | null) => {
    const startTimeValue = getTimeValue(startTime);
    const maxEndTime = getTimeValue('7:00 PM');
    
    for (const timeSlot of timeSlots) {
      const timeValue = getTimeValue(timeSlot);
      
      // Must be after start time and before/at 7 PM
      if (timeValue > startTimeValue && timeValue <= maxEndTime) {
        const { isDisabled } = getTimeSlotInfo(timeSlot, date, currentBookingId, originalBooking, true, startTime);
        if (!isDisabled) {
          return timeSlot;
        }
      }
    }
    
    // If no valid end time found, return the first slot after start time (even if it might be invalid)
    for (const timeSlot of timeSlots) {
      const timeValue = getTimeValue(timeSlot);
      if (timeValue > startTimeValue) {
        return timeSlot;
      }
    }
    
    return timeSlots[timeSlots.length - 1]; // Fallback to last slot
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-win95-gray/80 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Edit booking">
      <div className="win95-window max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="win95-window-header">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span>Edit Booking</span>
          </div>
          <button
            onClick={onClose}
            className="win95-button p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Client Information (Read-only) */}
          <div className="win95-panel p-4 mb-6">
            <h3 className="text-lg font-semibold text-win95-black font-win95 mb-3">Current Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-win95-black font-win95">Name:</span>
                <div className="font-semibold font-win95">{originalBooking?.clientName}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">Email:</span>
                <div className="font-semibold font-win95">{originalBooking?.clientEmail}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">Phone:</span>
                <div className="font-semibold font-win95">{originalBooking?.clientPhone}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t-2 border-win95-gray-dark">
              <div>
                <span className="text-win95-black font-win95">Current Date:</span>
                <div className="font-semibold font-win95">{originalBooking ? formatDate(originalBooking.date) : ''}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">Current Time:</span>
                <div className="font-semibold font-win95">{originalBooking ? `${originalBooking.startTime} - ${originalBooking.endTime}` : ''}</div>
                <div className="text-sm text-win95-black font-win95">{originalBooking ? calculateDuration(originalBooking.startTime, originalBooking.endTime).text : ''}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">Booking Created:</span>
                <div className="font-semibold font-win95">
                  {originalBooking ? new Date(originalBooking.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
                </div>
              </div>
            </div>
          </div>

          {/* New Booking Preview */}
          <div className="win95-panel p-4 mb-6">
            <h3 className="text-lg font-semibold text-win95-black font-win95 mb-3">New Booking Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-win95-black font-win95">New Date:</span>
                <div className="font-semibold text-win95-black font-win95">{formatDate(editableBooking.date)}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">New Time:</span>
                <div className="font-semibold text-win95-black font-win95">{editableBooking.startTime} - {editableBooking.endTime}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">New Duration:</span>
                <div className="font-semibold text-win95-black font-win95">{calculateDuration(editableBooking.startTime, editableBooking.endTime).text}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t-2 border-win95-gray-dark">
              <div>
                <span className="text-win95-black font-win95">New Total Price:</span>
                <div className="font-bold text-xl text-win95-black font-win95">${calculatePrice(editableBooking.date, editableBooking.startTime, editableBooking.endTime).total}</div>
              </div>
              <div>
                <span className="text-win95-black font-win95">Price Difference:</span>
                <div className="font-semibold text-win95-black font-win95">
                  {(() => {
                    const newPrice = calculatePrice(editableBooking.date, editableBooking.startTime, editableBooking.endTime).total;
                    const oldPrice = originalBooking?.totalPrice || 0;
                    const difference = newPrice - oldPrice;
                    if (difference > 0) {
                      return `+$${difference} (Additional charge)`;
                    } else if (difference < 0) {
                      return `-$${Math.abs(difference)} (Refund)`;
                    } else {
                      return '$0 (No change)';
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Time Selection Section - Now First */}
            <div>
              <h3 className="text-lg font-semibold text-win95-black font-win95 mb-4">Select New Time</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-win95-black font-win95 mb-2">Start Time</label>
                  <select
                    value={editableBooking.startTime}
                    onChange={(e) => setEditableBooking({
                      ...editableBooking,
                      startTime: e.target.value,
                      endTime: (() => {
                        // Check if current end time is still valid with new start time
                        const newStartTime = e.target.value;
                        const currentEndTime = editableBooking.endTime;
                        const newStartValue = getTimeValue(newStartTime);
                        const currentEndValue = getTimeValue(currentEndTime);
                        
                        // If end time is now invalid, find the first valid end time
                        if (currentEndValue <= newStartValue) {
                          return findFirstValidEndTime(newStartTime, editableBooking.date, editableBooking.id, originalBooking);
                        }
                        
                        return currentEndTime;
                      })()
                    })}
                    className="win95-input w-full"
                  >
                    {timeSlots.map((time) => {
                      const { displayText, isDisabled } = getTimeSlotInfo(time, editableBooking.date, editableBooking.id, originalBooking);
                      return (
                        <option key={time} value={time} disabled={isDisabled}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-win95-black font-win95 mb-2">End Time</label>
                  <select
                    value={editableBooking.endTime}
                    onChange={(e) => setEditableBooking({
                      ...editableBooking,
                      endTime: e.target.value
                    })}
                    className="win95-input w-full"
                  >
                    {timeSlots.map((time) => {
                      const { displayText, isDisabled } = getTimeSlotInfo(
                        time, 
                        editableBooking.date, 
                        editableBooking.id, 
                        originalBooking,
                        true, // isForEndTime
                        editableBooking.startTime // selectedStartTime
                      );
                      return (
                        <option key={time} value={time} disabled={isDisabled}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Date Selection Section - Now Second */}
            <div>
              <h3 className="text-lg font-semibold text-win95-black font-win95 mb-4">Select New Date</h3>
              <AdminDatePicker
                bookings={bookings}
                selectedDate={editableBooking.date}
                onSelectDate={(date) => setEditableBooking({
                  ...editableBooking,
                  date
                })}
                excludeBookingId={editableBooking.id}
                originalBookingDate={originalBooking?.date || ''}
              />
            </div>
          </div>

          {/* Current vs New Comparison */}
          {originalBooking && (
            <div className="win95-panel p-4 mb-6">
              <h4 className="font-semibold text-win95-black font-win95 mb-3">Summary of Changes</h4>
              <div className="text-sm text-win95-black font-win95">
                {(() => {
                  const hasDateChanged = originalBooking.date !== editableBooking.date;
                  const hasTimeChanged = originalBooking.startTime !== editableBooking.startTime || originalBooking.endTime !== editableBooking.endTime;
                  const newPrice = calculatePrice(editableBooking.date, editableBooking.startTime, editableBooking.endTime).total;
                  const hasPriceChanged = originalBooking.totalPrice !== newPrice;
                  
                  if (!hasDateChanged && !hasTimeChanged && !hasPriceChanged) {
                    return <div className="text-center py-2 font-win95">No changes detected</div>;
                  }
                  
                  const changes = [];
                  if (hasDateChanged) {
                    changes.push(`Date: ${formatDate(originalBooking.date)} → ${formatDate(editableBooking.date)}`);
                  }
                  if (hasTimeChanged) {
                    changes.push(`Time: ${originalBooking.startTime} - ${originalBooking.endTime} → ${editableBooking.startTime} - ${editableBooking.endTime}`);
                  }
                  if (hasPriceChanged) {
                    const difference = newPrice - originalBooking.totalPrice;
                    changes.push(`Price: $${originalBooking.totalPrice} → $${newPrice} (${difference > 0 ? '+' : ''}$${difference})`);
                  }
                  
                  return (
                    <div className="space-y-1">
                      {changes.map((change, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-win95-black"></div>
                          <span className="font-win95">{change}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="win95-button flex-1 px-6 py-3"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="win95-button flex-1 px-6 py-3"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;