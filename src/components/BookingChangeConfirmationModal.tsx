import React, { useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, User, ArrowRight } from 'lucide-react';
import { Booking } from '../types/booking';

interface BookingChangeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldBooking: Booking;
  newBooking: Booking;
  onConfirm: () => void;
}

const BookingChangeConfirmationModal: React.FC<BookingChangeConfirmationModalProps> = ({
  isOpen,
  onClose,
  oldBooking,
  newBooking,
  onConfirm
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasDateChanged = oldBooking.date !== newBooking.date;
  const hasTimeChanged = oldBooking.startTime !== newBooking.startTime || oldBooking.endTime !== newBooking.endTime;
  const hasPriceChanged = oldBooking.totalPrice !== newBooking.totalPrice;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" role="dialog" aria-modal="true" aria-label="Confirm booking changes">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Confirm Booking Changes</h2>
            <p className="text-yellow-100">
              You are about to modify this booking. Please review the changes below.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Client Information */}
          <div className="bg-gray-50 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Client: {oldBooking.clientName}</h3>
            </div>
            <div className="text-sm text-gray-600">
              {oldBooking.clientEmail} • {oldBooking.clientPhone}
            </div>
          </div>

          {/* Changes Comparison */}
          <div className="space-y-6">
            {/* Date Changes */}
            {hasDateChanged && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Date Change</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">From:</div>
                    <div className="font-medium text-gray-900">{formatDate(oldBooking.date)}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">To:</div>
                    <div className="font-medium text-blue-900">{formatDate(newBooking.date)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Time Changes */}
            {hasTimeChanged && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Time Change</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">From:</div>
                    <div className="font-medium text-gray-900">
                      {oldBooking.startTime} - {oldBooking.endTime}
                    </div>
                    <div className="text-sm text-gray-500">{oldBooking.duration}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">To:</div>
                    <div className="font-medium text-green-900">
                      {newBooking.startTime} - {newBooking.endTime}
                    </div>
                    <div className="text-sm text-green-700">{newBooking.duration}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Price Changes */}
            {hasPriceChanged && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Price Change</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">From:</div>
                    <div className="font-bold text-2xl text-gray-900">${oldBooking.totalPrice}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">To:</div>
                    <div className="font-bold text-2xl text-purple-900">${newBooking.totalPrice}</div>
                  </div>
                </div>
                {newBooking.totalPrice > oldBooking.totalPrice ? (
                  <div className="mt-2 text-sm text-purple-700">
                    Additional charge: ${newBooking.totalPrice - oldBooking.totalPrice}
                  </div>
                ) : newBooking.totalPrice < oldBooking.totalPrice ? (
                  <div className="mt-2 text-sm text-purple-700">
                    Refund amount: ${oldBooking.totalPrice - newBooking.totalPrice}
                  </div>
                ) : null}
              </div>
            )}

            {/* No Changes Message */}
            {!hasDateChanged && !hasTimeChanged && !hasPriceChanged && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-gray-600">No date, time, or price changes detected.</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel Changes
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-studio-green text-white font-semibold hover:bg-studio-green-darker transition-colors duration-200"
            >
              Confirm Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingChangeConfirmationModal;