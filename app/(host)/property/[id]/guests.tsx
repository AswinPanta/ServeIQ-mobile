import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyGuests } from '@/components/host/screens/PropertyGuests';

export default function GuestsRoute() {
  return (
    <PropertySectionScreen title="Guests" icon="people-outline">
      {(property) => <PropertyGuests property={property} />}
    </PropertySectionScreen>
  );
}