import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyStaff } from '@/components/host/screens/PropertyStaff';

export default function StaffRoute() {
  return (
    <PropertySectionScreen title="Staff" icon="briefcase-outline">
      {(property) => <PropertyStaff property={property} />}
    </PropertySectionScreen>
  );
}