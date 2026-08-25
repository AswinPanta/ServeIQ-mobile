import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertyReports } from '@/components/host/screens/PropertyReports';

export default function ReportsRoute() {
  return (
    <PropertySectionScreen title="Reports" icon="bar-chart-outline">
      {(property) => <PropertyReports property={property} />}
    </PropertySectionScreen>
  );
}