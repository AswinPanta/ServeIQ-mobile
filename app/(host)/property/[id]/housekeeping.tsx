import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyHousekeeping } from '@/components/host/screens/PropertyHousekeeping';

export default function HousekeepingRoute() {
  return (
    <PropertySectionScreen title="Housekeeping" icon="sparkles-outline">
      {(property) => <PropertyHousekeeping property={property} />}
    </PropertySectionScreen>
  );
}