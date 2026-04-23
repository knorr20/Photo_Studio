import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Clock, DollarSign, User, Mail, Phone, Camera, FileText, CreditCard as Edit, Check, X, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Filter, Search, AlertCircle, MessageSquare, Archive, MoreVertical, RotateCcw, LayoutDashboard } from 'lucide-react';
import { Booking } from '../types/booking';
import { ContactMessage } from '../types/contactMessage';
import AdminDatePicker from './AdminDatePicker';
import BookingChangeConfirmationModal from './BookingChangeConfirmationModal';
import ViewBookingModal from './ViewBookingModal';
import EditBookingModal from './EditBookingModal';
import ConfirmationModal from './ConfirmationModal';
import BookingConflictModal from './BookingConflictModal';
import { calculateDuration, calculatePrice } from '../utils/bookingCalculations';
import { checkBookingOverlap } from '../utils/bookingCalculations';
import AdminTaskbar from './AdminTaskbar';
import MediaPlayer from './MediaPlayer';

interface AdminPanelProps {
  onLogout: () => void;
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: number, newStatus: 'confirmed' | 'pending' | 'cancelled') => void;
  onDeclineBooking: (bookingId: number) => void;
  onUpdateBookingDetails: (bookingId: number, updates: { date: string; startTime: string; endTime: string; duration: string; totalPrice: number }) => void;
  contactMessages: ContactMessage[];
  onUpdateContactMessageStatus: (messageId: number, newStatus: 'new' | 'read' | 'archived') => void;
  onDeleteContactMessage: (messageId: number) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onLogout,
  bookings,
  onUpdateBookingStatus,
  onDeclineBooking,
  onUpdateBookingDetails,
  contactMessages,
  onUpdateContactMessageStatus,
  onDeleteContactMessage
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editableBooking, setEditableBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeConfirmation, setShowChangeConfirmation] = useState(false);
  const [originalBooking, setOriginalBooking] = useState<Booking | null>(null);
  const [showTableConfirmation, setShowTableConfirmation] = useState(false);
  const [pendingTableAction, setPendingTableAction] = useState<{
    type: 'confirm' | 'decline' | 'revert';
    bookingId: number;
    clientName: string;
    status: string;
  } | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingBooking, setConflictingBooking] = useState<Booking | null>(null);
  const [isMediaPlayerMinimized, setIsMediaPlayerMinimized] = useState(false);

  const handleEditBooking = (booking: Booking) => {
    setEditableBooking({ ...booking });
    setOriginalBooking({ ...booking });
    setShowEditModal(true);
  };

  const handleSaveBookingEdit = () => {
    if (!editableBooking || !originalBooking) return;

    // Check if there are any changes
    const hasChanges = 
      editableBooking.date !== originalBooking.date ||
      editableBooking.startTime !== originalBooking.startTime ||
      editableBooking.endTime !== originalBooking.endTime;

    if (hasChanges) {
      setShowChangeConfirmation(true);
    } else {
      setShowEditModal(false);
      setEditableBooking(null);
      setOriginalBooking(null);
    }
  };

  const handleConfirmChanges = () => {
    if (!editableBooking || !originalBooking) return;

    const conflicting = checkBookingOverlap(editableBooking, bookings);
    if (conflicting) {
      const fullConflictingBooking = bookings.find(b => b.id === conflicting.id);
      if (fullConflictingBooking) {
        setConflictingBooking(fullConflictingBooking);
        setShowConflictModal(true);
      }
      setShowChangeConfirmation(false);
      return;
    }

    const duration = calculateDuration(editableBooking.startTime, editableBooking.endTime);
    const price = calculatePrice(editableBooking.date, editableBooking.startTime, editableBooking.endTime);

    onUpdateBookingDetails(editableBooking.id, {
      date: editableBooking.date,
      startTime: editableBooking.startTime,
      endTime: editableBooking.endTime,
      duration: duration.text,
      totalPrice: price.total
    });

    setShowChangeConfirmation(false);
    setShowEditModal(false);
    setEditableBooking(null);
    setOriginalBooking(null);
  };

  const handleTableConfirm = (booking: Booking) => {
    setPendingTableAction({
      type: 'confirm',
      bookingId: booking.id,
      clientName: booking.clientName,
      status: booking.status
    });
    setShowTableConfirmation(true);
  };

  const handleTableDecline = (booking: Booking) => {
    setPendingTableAction({
      type: 'decline',
      bookingId: booking.id,
      clientName: booking.clientName,
      status: booking.status
    });
    setShowTableConfirmation(true);
  };

  const handleTableRevert = (booking: Booking) => {
    setPendingTableAction({
      type: 'revert',
      bookingId: booking.id,
      clientName: booking.clientName,
      status: booking.status
    });
    setShowTableConfirmation(true);
  };

  const handleConfirmTableAction = () => {
    if (!pendingTableAction) return;

    if (pendingTableAction.type === 'revert') {
      // Find the booking to revert
      const bookingToRevert = bookings.find(b => b.id === pendingTableAction.bookingId);
      if (!bookingToRevert) {
        console.error('Booking to revert not found');
        setShowTableConfirmation(false);
        setPendingTableAction(null);
        return;
      }

      // Check for overlapping bookings
      const conflictingBookingResult = checkBookingOverlap(bookingToRevert, bookings);
      
      if (conflictingBookingResult) {
        // Find the full booking object for the conflicting booking
        const fullConflictingBooking = bookings.find(b => b.id === conflictingBookingResult.id);
        if (fullConflictingBooking) {
          setConflictingBooking(fullConflictingBooking);
          setShowConflictModal(true);
        }
        setShowTableConfirmation(false);
        setPendingTableAction(null);
        return;
      }

      // No conflict, proceed with revert
      onUpdateBookingStatus(pendingTableAction.bookingId, 'pending');
    } else if (pendingTableAction.type === 'confirm') {
      onUpdateBookingStatus(pendingTableAction.bookingId, 'confirmed');
    } else if (pendingTableAction.type === 'decline') {
      onDeclineBooking(pendingTableAction.bookingId);
    }

    setShowTableConfirmation(false);
    setPendingTableAction(null);
  };

  const handleCancelTableAction = () => {
    setShowTableConfirmation(false);
    setPendingTableAction(null);
  };

  const handleCancelChanges = () => {
    setShowChangeConfirmation(false);
  };

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-800 bg-blue-100';
      case 'read': return 'text-green-800 bg-green-100';
      case 'archived': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

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

  const handleOpenMediaPlayer = () => {
    setIsMediaPlayerMinimized(false);
  };

  const handleMinimizeMediaPlayer = () => {
    setIsMediaPlayerMinimized(true);
  };

  const handleRestoreMediaPlayer = () => {
    setIsMediaPlayerMinimized(false);
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const newMessages = contactMessages.filter(m => m.status === 'new');

  return (
    <div className="min-h-screen bg-win95-gray font-win95">
      {/* Header */}
      <div className="win95-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/IMG_2896-2.png" 
                alt="FILMS Studio Logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-win95-black">Admin Panel</h1>
            </div>
            <button
              onClick={onLogout}
              className="win95-button flex items-center space-x-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="win95-panel border-b-2 border-win95-gray-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-col sm:flex-row sm:space-x-8 space-y-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`win95-tab ${
                activeTab === 'dashboard'
                  ? 'active'
                  : ''
              } flex-1 sm:flex-none flex items-center gap-2`}
            >
              <span className="w-6 flex justify-center items-center">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`win95-tab ${
                activeTab === 'bookings'
                  ? 'active'
                  : ''
              } flex-1 sm:flex-none flex items-center gap-2`}
            >
              <span className="w-6 flex justify-center items-center">
                <Calendar className="h-5 w-5" />
              </span>
              Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`win95-tab ${
                activeTab === 'messages'
                  ? 'active'
                  : ''
              } flex-1 sm:flex-none flex items-center gap-2`}
            >
              <span className="w-6 flex justify-center items-center">
                <MessageSquare className="h-5 w-5" />
              </span>
              Messages ({contactMessages.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-win95-black mb-8">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="win95-panel p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-win95-black" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-win95-black">Total Bookings</p>
                    <p className="text-2xl font-bold text-win95-black">{bookings.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="win95-panel p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-win95-black" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-win95-black">Pending</p>
                    <p className="text-2xl font-bold text-win95-black">{pendingBookings.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="win95-panel p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Check className="h-8 w-8 text-win95-black" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-win95-black">Confirmed</p>
                    <p className="text-2xl font-bold text-win95-black">{confirmedBookings.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="win95-panel p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-win95-black" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-win95-black">New Messages</p>
                    <p className="text-2xl font-bold text-win95-black">{newMessages.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Bookings */}
              <div className="win95-window">
                <div className="win95-window-header">
                  <h3 className="text-sm font-bold">Recent Bookings</h3>
                </div>
                <div className="p-4 space-y-2">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="win95-panel p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-win95-black">{booking.clientName}</p>
                          <p className="text-sm text-win95-black">{formatDate(booking.date)} • {booking.startTime} - {booking.endTime}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium border-2 ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Messages */}
              <div className="win95-window">
                <div className="win95-window-header">
                  <h3 className="text-sm font-bold">Recent Messages</h3>
                </div>
                <div className="p-4 space-y-2">
                  {contactMessages.slice(0, 5).map((message) => (
                    <div key={message.id} className="win95-panel p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-win95-black">{message.name}</p>
                          <p className="text-sm text-win95-black truncate max-w-xs">{message.message}</p>
                        </div>
                        <span className="win95-button px-2 py-1 text-xs">
                          {message.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-win95-black">Bookings Management</h2>
            </div>

            {/* Bookings Table */}
            <div className="win95-table overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-win95-gray-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {bookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-win95-gray-light cursor-pointer border-b border-win95-gray-dark"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowViewModal(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-win95-black">{booking.clientName}</div>
                          <div className="text-sm text-win95-black">{booking.clientEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-win95-black">{formatDate(booking.date)}</div>
                        <div className="text-sm text-win95-black">{booking.startTime} - {booking.endTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-win95-black">{booking.projectType}</div>
                        <div className="text-sm text-win95-black">{booking.duration}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-win95-black">${booking.totalPrice}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium border-2 ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(booking);
                            setShowViewModal(true);
                          }}
                          className="win95-button p-1"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBooking(booking);
                          }}
                          className="win95-button p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {booking.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableDecline(booking);
                            }}
                            className="win95-button p-1"
                            title="Decline booking"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTableConfirm(booking);
                              }}
                              className="win95-button p-1"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {/* Revert to Pending Button - Only for confirmed bookings */}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableRevert(booking);
                            }}
                            className="win95-button p-1"
                            title="Revert to pending"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableRevert(booking);
                            }}
                            className="win95-button p-1"
                            title="Revert to pending"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-win95-black">Contact Messages</h2>
            </div>

            {/* Messages Table */}
            <div className="win95-table overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-win95-gray-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-win95-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {contactMessages.map((message) => (
                    <tr key={message.id} className="hover:bg-win95-gray-light border-b border-win95-gray-dark">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-win95-black">{message.name}</div>
                          <div className="text-sm text-win95-black">{message.email}</div>
                          {message.phone && (
                            <div className="text-sm text-win95-black">{message.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-win95-black max-w-xs truncate">{message.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-win95-black">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="win95-button px-2 py-1 text-xs">
                          {message.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {message.status === 'new' && (
                          <button
                            onClick={() => onUpdateContactMessageStatus(message.id, 'read')}
                            className="win95-button px-2 py-1 text-xs"
                          >
                            Mark Read
                          </button>
                        )}
                        {message.status === 'read' && (
                          <button
                            onClick={() => onUpdateContactMessageStatus(message.id, 'archived')}
                            className="win95-button px-2 py-1 text-xs"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteContactMessage(message.id)}
                          className="win95-button px-2 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Media Player */}
      <MediaPlayer 
        onMinimize={handleMinimizeMediaPlayer}
        isHidden={isMediaPlayerMinimized}
      />

      {/* Modals */}
      <ViewBookingModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        selectedBooking={selectedBooking}
        onUpdateBookingStatus={onUpdateBookingStatus}
        onDeclineBooking={onDeclineBooking}
        onEditBooking={handleEditBooking}
        onRevertBooking={handleTableRevert}
      />

      <EditBookingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editableBooking={editableBooking}
        setEditableBooking={setEditableBooking}
        originalBooking={originalBooking}
        onSave={handleSaveBookingEdit}
        bookings={bookings}
      />

      {/* Booking Change Confirmation Modal */}
      {showChangeConfirmation && editableBooking && originalBooking && (
        <BookingChangeConfirmationModal
          isOpen={showChangeConfirmation}
          onClose={handleCancelChanges}
          oldBooking={originalBooking}
          newBooking={{
            ...editableBooking,
            duration: calculateDuration(editableBooking.startTime, editableBooking.endTime).text,
            totalPrice: calculatePrice(editableBooking.date, editableBooking.startTime, editableBooking.endTime).total
          }}
          onConfirm={handleConfirmChanges}
        />
      )}

      {/* Table Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={showTableConfirmation}
        onClose={handleCancelTableAction}
        title={
          pendingTableAction?.type === 'confirm' 
            ? 'Confirm Booking' 
            : pendingTableAction?.type === 'decline'
            ? 'Decline Booking'
            : 'Revert Booking'
        }
        message={
          pendingTableAction?.type === 'confirm'
            ? `Are you sure you want to confirm this booking for ${pendingTableAction?.clientName}?`
            : pendingTableAction?.type === 'decline'
            ? pendingTableAction?.status === 'pending'
            ? `Are you sure you want to decline this booking for ${pendingTableAction?.clientName}?`
            : `Are you sure you want to cancel this booking for ${pendingTableAction?.clientName}?`
            : `Are you sure you want to change this booking back to pending status for ${pendingTableAction?.clientName}?`
        }
        confirmText={
          pendingTableAction?.type === 'confirm' 
            ? 'Yes, Confirm' 
            : pendingTableAction?.type === 'decline'
            ? 'Yes, Decline'
            : 'Yes, Revert to Pending'
        }
        cancelText="No, Keep It"
        onConfirm={handleConfirmTableAction}
        type={pendingTableAction?.type === 'revert' ? 'warning' : pendingTableAction?.type}
      />

      {/* Booking Conflict Modal */}
      <BookingConflictModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setConflictingBooking(null);
        }}
        conflictingBooking={conflictingBooking}
      />

      {/* Windows 95 Taskbar */}
      <AdminTaskbar 
        onOpenMediaPlayer={handleOpenMediaPlayer}
        isMediaPlayerMinimized={isMediaPlayerMinimized}
        onRestoreMediaPlayer={handleRestoreMediaPlayer}
      />
    </div>
  );
};

export default AdminPanel;