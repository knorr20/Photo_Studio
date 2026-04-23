import React, { useEffect } from 'react';
import { X, AlertTriangle, Calendar, Clock, DollarSign, User, Mail, Phone, Camera } from 'lucide-react';
import { Booking } from '../types/booking';

interface BookingConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictingBooking: Booking | null;
}

const BookingConflictModal: React.FC<BookingConflictModalProps> = ({
  isOpen,
  onClose,
  conflictingBooking
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !conflictingBooking) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-win95-green text-win95-white border-win95-green';
      case 'pending': return 'bg-win95-yellow text-win95-black border-win95-yellow';
      case 'cancelled': return 'bg-win95-red text-win95-white border-win95-red';
      default: return 'bg-win95-gray text-win95-black border-win95-gray';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80]" role="dialog" aria-modal="true" aria-label="Booking time conflict">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Revert Not Possible</h2>
            <p className="text-red-100">Time slot conflict detected</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Conflict Message */}
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Cannot Revert to Pending</h3>
            </div>
            <p className="text-red-800">
              This time slot is already occupied by another booking with{' '}
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border-2 ${getStatusColor(conflictingBooking.status)}`}>
                {conflictingBooking.status}
              </span>{' '}
              status. Please review the conflicting booking details below.
            </p>
          </div>

          {/* Conflicting Booking Details */}
          <div className="bg-gray-50 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Conflicting Booking Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Client Name</div>
                    <div className="font-semibold text-gray-900">{conflictingBooking.clientName}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold text-gray-900">{conflictingBooking.clientEmail}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-semibold text-gray-900">{conflictingBooking.clientPhone}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="font-semibold text-gray-900">{formatDate(conflictingBooking.date)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Time</div>
                    <div className="font-semibold text-gray-900">
                      {conflictingBooking.startTime} - {conflictingBooking.endTime}
                    </div>
                    <div className="text-sm text-gray-500">Duration: {conflictingBooking.duration}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Project Type</div>
                    <div className="font-semibold text-gray-900">{conflictingBooking.projectType}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Cost</span>
                <span className="font-bold text-2xl text-studio-green">${conflictingBooking.totalPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border-2 ${getStatusColor(conflictingBooking.status)}`}>
                  {conflictingBooking.status}
                </span>
              </div>
            </div>
            
            {conflictingBooking.notes && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Additional Notes</div>
                <div className="text-gray-900 bg-white p-3 border border-gray-200">
                  {conflictingBooking.notes}
                </div>
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500">
              <div className="text-sm text-gray-600 mb-1">Booking Created</div>
              <div className="font-semibold text-gray-900">
                {new Date(conflictingBooking.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Resolution Options */}
          <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">Resolution Options</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Contact the conflicting booking client to discuss rescheduling</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Cancel or modify the conflicting booking if appropriate</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <span>Find an alternative time slot for the booking you want to revert</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 px-6 font-semibold hover:bg-gray-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConflictModal;