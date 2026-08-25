import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { AmenitiesSection } from '@/components/host/settings/AmenitiesSection';

export default function SettingsAmenitiesRoute() {
  return (
    <PropertySectionScreen title="Amenities" icon="sparkles-outline">
      {() => <AmenitiesSection />}
    </PropertySectionScreen>
  );
}