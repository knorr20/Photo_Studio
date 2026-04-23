import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Booking } from '../types/booking';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertDbRowToBooking = (row: any): Booking => ({
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    projectType: row.project_type,
    totalPrice: row.total_price,
    status: row.status,
    notes: row.notes,
    receivePromotionalComms: row.receive_promotional_comms || false,
    agreedToTerms: row.agreed_to_terms || false,
    termsAgreedAt: row.terms_agreed_at,
    receivePromotionalCommsAt: row.receive_promotional_comms_at,
    createdAt: row.created_at,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    paymentStatus: row.payment_status ?? 'unpaid',
    receiptUrl: row.receipt_url ?? null,
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data?.map(convertDbRowToBooking) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const addBooking = async (newBooking: Omit<Booking, 'id' | 'createdAt'>, honeypot: string = ''): Promise<number> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spam-protection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ type: 'booking', data: newBooking, honeypot }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error(errorData.error || 'This time slot is no longer available. Please choose a different time.');
        }
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const responseData = await response.json();
      await fetchBookings();
      return responseData.bookingId as number;
    } catch (err) {
      throw err;
    }
  };

  const updatePayment = async (_bookingId: number, _paymentIntentId: string) => {
    await fetchBookings();
  };

  const updateBookingStatus = async (bookingId: number, newStatus: 'confirmed' | 'pending' | 'cancelled') => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      const convertedBooking = convertDbRowToBooking(data);
      setBookings(prev => prev.map(b => b.id === bookingId ? convertedBooking : b));
      return convertedBooking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking status');
      throw err;
    }
  };

  const updateBookingDetails = async (
    bookingId: number,
    updates: { date: string; startTime: string; endTime: string; duration: string; totalPrice: number }
  ) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          date: updates.date,
          start_time: updates.startTime,
          end_time: updates.endTime,
          duration: updates.duration,
          total_price: updates.totalPrice,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      const convertedBooking = convertDbRowToBooking(data);
      setBookings(prev => prev.map(b => b.id === bookingId ? convertedBooking : b));
      return convertedBooking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking details');
      throw err;
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
      throw err;
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return {
    bookings,
    loading,
    error,
    clearError: () => setError(null),
    addBooking,
    updatePayment,
    updateBookingStatus,
    updateBookingDetails,
    deleteBooking,
    refetch: fetchBookings,
  };
};
