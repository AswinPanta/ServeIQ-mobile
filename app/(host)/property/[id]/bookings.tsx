import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyBookings } from '@/components/host/screens/PropertyBookings';

export default function BookingsRoute() {
  return (
    <PropertySectionScreen title="Bookings" icon="receipt-outline">
      {(property) => <PropertyBookings property={property} />}
    </PropertySectionScreen>
  );
}