import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import StudioFeatures from '../components/StudioFeatures';
import Equipment from '../components/Equipment';
import TariffSign from '../components/TariffSign';
import Calendar from '../components/Calendar';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { Booking } from '../types/booking';

interface WebsiteLayoutProps {
  bookings: Booking[];
  onAddBooking: (booking: Omit<Booking, 'id' | 'createdAt'>, honeypot?: string) => Promise<number>;
  onUpdatePayment: (bookingId: number, paymentIntentId: string) => Promise<void>;
  stripePublishableKey: string;
  onAdminAccess: () => void;
  onNavigateAndScroll: (sectionId: string) => void;
}

const WebsiteLayout: React.FC<WebsiteLayoutProps> = ({
  bookings,
  onAddBooking,
  onUpdatePayment,
  stripePublishableKey,
  onAdminAccess,
  onNavigateAndScroll,
}) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigateAndScroll={onNavigateAndScroll} />
      <main id="main-content">
        <Hero />
        <StudioFeatures />
        <TariffSign />
        <Equipment />
        <Calendar
          bookings={bookings}
          onAddBooking={onAddBooking}
          onUpdatePayment={onUpdatePayment}
          stripePublishableKey={stripePublishableKey}
        />
        <Contact />
      </main>
      <Footer onAdminAccess={onAdminAccess} onNavigateAndScroll={onNavigateAndScroll} />

      <button
        onClick={onAdminAccess}
        className="fixed bottom-4 right-4 w-12 h-12 bg-studio-green text-white rounded-lg opacity-20 hover:opacity-100 transition-opacity duration-300"
        title="Admin Access"
      >
        A
      </button>
    </div>
  );
};

export default WebsiteLayout;
