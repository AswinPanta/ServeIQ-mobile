import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyRooms } from '@/components/host/screens/PropertyRooms';

export default function RoomsRoute() {
  return (
    <PropertySectionScreen title="Rooms" icon="bed-outline">
      {(property) => <PropertyRooms property={property} />}
    </PropertySectionScreen>
  );
}