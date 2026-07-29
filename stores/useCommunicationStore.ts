/**
 * Phase 8 — Communication
 * Automated notification management and communication history.
 * Tracks email, SMS, WhatsApp, and manual calls per booking/guest.
 */
import { create } from 'zustand';

export type CommunicationChannel = 'email' | 'sms' | 'whatsapp' | 'call' | 'note';
export type NotificationTemplate = 'booking_confirmation' | 'checkin_reminder' | 'checkin_instructions' | 'thank_you' | 'review_request' | 'cancellation' | 'payment_receipt';

export interface CommunicationRecord {
  id: string;
  bookingRef: string;
  guestName: string;
  channel: CommunicationChannel;
  template?: NotificationTemplate;
  subject: string;
  content: string;
  sentAt: string;
  sentBy: string;
  status: 'sent' | 'failed' | 'scheduled';
  readAt?: string;
}

interface CommunicationStore {
  history: CommunicationRecord[];
  getBookingHistory: (bookingRef: string) => CommunicationRecord[];
  sendCommunication: (comm: Omit<CommunicationRecord, 'id' | 'sentAt' | 'status'>) => CommunicationRecord;
  scheduleCommunication: (comm: Omit<CommunicationRecord, 'id' | 'sentAt' | 'status'> & { scheduleAt: string }) => void;
  autoSendBookingConfirmation: (booking: { ref: string; guestName: string; email: string; roomType: string; checkin: string; checkout: string; totalPrice: number }) => void;
  autoSendCheckinReminder: (booking: { ref: string; guestName: string; email: string; checkin: string }) => void;
  autoSendThankYou: (booking: { ref: string; guestName: string; email: string; hotelName: string }) => void;
}

let commCounter = 0;

export const useCommunicationStore = create<CommunicationStore>((set, get) => ({
  history: [],

  getBookingHistory: (bookingRef) => get().history.filter(h => h.bookingRef === bookingRef),

  sendCommunication: (comm) => {
    const record: CommunicationRecord = {
      ...comm,
      id: `comm-${++commCounter}`,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };
    set(s => ({ history: [...s.history, record] }));
    return record;
  },

  scheduleCommunication: (comm) => {
    // In a real app, this would push to a queue
    const record: CommunicationRecord = {
      ...comm,
      id: `comm-${++commCounter}`,
      sentAt: (comm as any).scheduleAt || new Date().toISOString(),
      status: 'scheduled',
    };
    set(s => ({ history: [...s.history, record] }));
  },

  autoSendBookingConfirmation: (booking) => {
    get().sendCommunication({
      bookingRef: booking.ref,
      guestName: booking.guestName,
      channel: 'email',
      template: 'booking_confirmation',
      subject: 'Booking Confirmed — ' + booking.ref,
      content: `Dear ${booking.guestName},\n\nYour booking at StayEasy has been confirmed.\n\nRef: ${booking.ref}\nRoom: ${booking.roomType}\nCheck-in: ${booking.checkin}\nCheck-out: ${booking.checkout}\nTotal: NPR ${booking.totalPrice.toLocaleString()}\n\nThank you for choosing StayEasy!`,
      sentBy: 'System',
    });
  },

  autoSendCheckinReminder: (booking) => {
    get().sendCommunication({
      bookingRef: booking.ref,
      guestName: booking.guestName,
      channel: 'email',
      template: 'checkin_reminder',
      subject: 'Check-in Tomorrow — ' + booking.ref,
      content: `Dear ${booking.guestName},\n\nThis is a reminder that you check-in tomorrow (${booking.checkin}).\nYour digital key will be ready 2 hours before check-in.\n\nNeed help? Contact the front desk.`,
      sentBy: 'System',
    });
  },

  autoSendThankYou: (booking) => {
    get().sendCommunication({
      bookingRef: booking.ref,
      guestName: booking.guestName,
      channel: 'email',
      template: 'thank_you',
      subject: 'Thank You from ' + booking.hotelName,
      content: `Dear ${booking.guestName},\n\nThank you for staying at ${booking.hotelName}! We hope you had a wonderful experience.\n\nPlease leave a review to help other travellers.\n\nWe look forward to welcoming you again!`,
      sentBy: 'System',
    });
  },
}));
