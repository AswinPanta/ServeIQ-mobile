import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { BookingSection } from '@/components/host/settings/BookingSection';

export default function SettingsBookingRoute() {
  return (
    <PropertySectionScreen title="Booking Settings" icon="calendar-outline">
      {() => <BookingSection />}
    </PropertySectionScreen>
  );
}