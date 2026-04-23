import React, { useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, User, Mail, Phone, Camera, CreditCard as Edit, Check, XCircle, RotateCcw } from 'lucide-react';
import { Booking } from '../types/booking';
import ConfirmationModal from './ConfirmationModal';

interface ViewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooking: Booking | null;
  onUpdateBookingStatus?: (bookingId: number, newStatus: 'confirmed' | 'pending' | 'cancelled') => void;
  onDeclineBooking?: (bookingId: number) => void;
  onEditBooking?: (booking: Booking) => void;
  onRevertBooking?: (booking: Booking) => void;
}

type PendingAction = {
  type: 'confirm' | 'decline';
  bookingId: number;
} | null;

const ViewBookingModal: React.FC<ViewBookingModalProps> = ({
  isOpen,
  onClose,
  selectedBooking,
  onUpdateBookingStatus,
  onDeclineBooking,
  onEditBooking,
  onRevertBooking
}) => {
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedBooking) return null;

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

  const handleConfirm = () => {
    setPendingAction({
      type: 'confirm',
      bookingId: selectedBooking.id
    });
  };

  const handleCancel = () => {
    setPendingAction({
      type: 'decline',
      bookingId: selectedBooking.id
    });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'confirm' && onUpdateBookingStatus) {
      onUpdateBookingStatus(pendingAction.bookingId, 'confirmed');
    } else if (pendingAction.type === 'decline' && onDeclineBooking) {
      onDeclineBooking(pendingAction.bookingId);
    }

    setPendingAction(null);
    onClose();
  };

  const handleEdit = () => {
    if (onEditBooking && selectedBooking) {
      onEditBooking(selectedBooking);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-win95-gray/80 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="View booking details">
      <div className="win95-window max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="win95-window-header">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Booking Details</span>
          </div>
          <button
            onClick={onClose}
            className="win95-button p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-win95-black" />
                <div>
                  <div className="text-sm text-win95-black font-win95">Client Name</div>
                  <div className="font-semibold text-win95-black font-win95">{selectedBooking.clientName}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-win95-black" />
                <div>
                  <div className="text-sm text-win95-black font-win95">Email</div>
                  <div className="font-semibold text-win95-black font-win95">{selectedBooking.clientEmail}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-win95-black" />
                <div>
                  <div className="text-sm text-win95-black font-win95">Phone</div>
                  <div className="font-semibold text-win95-black font-win95">{selectedBooking.clientPhone}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-win95-black" />
                <div>
                  <div className="text-sm text-win95-black font-win95">Date</div>
                  <div className="font-semibold text-win95-black font-win95">{formatDate(selectedBooking.date)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-win95-black" />
                <div>
                  <div className="text-sm text-win95-black font-win95">Time</div>
                  <div className="font-semibold text-win95-black font-win95">
                    {selectedBooking.startTime} - {selectedBooking.endTime}
                  </div>
                  <div className="text-sm text-win95-black font-win95">Duration: {selectedBooking.duration}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-win95-black" />
                <div>
                  <div className="text-sm text-win95-black font-win95">Project Type</div>
                  <div className="font-semibold text-win95-black font-win95">{selectedBooking.projectType}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 win95-panel">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-win95-black font-win95">Total Cost</span>
              <span className="font-bold text-2xl text-win95-black font-win95">${selectedBooking.totalPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-win95-black font-win95">Status</span>
              <span className={`px-2 py-1 text-xs font-medium border-2 ${getStatusColor(selectedBooking.status)}`}>
                {selectedBooking.status}
              </span>
            </div>
          </div>
          
          {selectedBooking.notes && (
            <div className="mt-6">
              <div className="text-sm text-win95-black font-win95 mb-2">Additional Notes</div>
              <div className="text-win95-black font-win95 win95-panel p-3">
                {selectedBooking.notes}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {/* Edit Button - Always visible */}
            <button
              onClick={handleEdit}
              className="win95-button flex items-center justify-center gap-2 px-4 py-2 flex-1"
            >
              <Edit className="h-4 w-4" />
              Edit Booking
            </button>

            {/* Revert to Pending Button - For confirmed and cancelled bookings */}
            {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'cancelled') && (
              <button
                onClick={() => {
                  if (onRevertBooking && selectedBooking) {
                    onRevertBooking(selectedBooking);
                    onClose();
                  }
                }}
                className="win95-button flex items-center justify-center gap-2 px-4 py-2 flex-1"
              >
                <RotateCcw className="h-4 w-4" />
                Revert to Pending
              </button>
            )}

            {/* Confirm Button - Only for pending bookings */}
            {selectedBooking.status === 'pending' && (
              <button
                onClick={handleConfirm}
                className="win95-button flex items-center justify-center gap-2 px-4 py-2 flex-1"
              >
                <Check className="h-4 w-4" />
                Confirm Booking
              </button>
            )}

            {/* Cancel Button - For pending and confirmed bookings */}
            {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
              <button
                onClick={handleCancel}
                className="win95-button flex items-center justify-center gap-2 px-4 py-2 flex-1"
              >
                <XCircle className="h-4 w-4" />
                {selectedBooking.status === 'pending' ? 'Decline Booking' : 'Cancel Booking'}
              </button>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="win95-button px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.type === 'confirm' ? 'Confirm Booking' : 'Decline Booking'}
        message={
          pendingAction?.type === 'confirm'
            ? `Are you sure you want to confirm this booking for ${selectedBooking?.clientName}?`
            : selectedBooking?.status === 'pending'
            ? `Are you sure you want to decline this booking for ${selectedBooking?.clientName}?`
            : `Are you sure you want to cancel this booking for ${selectedBooking?.clientName}?`
        }
        confirmText={pendingAction?.type === 'confirm' ? 'Yes, Confirm' : 'Yes, Decline'}
        cancelText="No, Keep It"
        onConfirm={handleConfirmAction}
        type={pendingAction?.type}
      />
    </div>
  );
};

export default ViewBookingModal;