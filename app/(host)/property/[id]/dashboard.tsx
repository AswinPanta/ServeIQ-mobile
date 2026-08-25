import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyDashboard } from '@/components/host/screens/PropertyDashboard';

export default function DashboardRoute() {
  return (
    <PropertySectionScreen title="Dashboard" icon="grid-outline">
      {(property) => <PropertyDashboard property={property} />}
    </PropertySectionScreen>
  );
}