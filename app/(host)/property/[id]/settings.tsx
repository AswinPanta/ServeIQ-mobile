import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PropertySettings } from '@/components/host/screens/PropertySettings';

export default function SettingsRoute() {
  return (
    <PropertySectionScreen title="Settings" icon="settings-outline">
      {(property) => <PropertySettings property={property} />}
    </PropertySectionScreen>
  );
}