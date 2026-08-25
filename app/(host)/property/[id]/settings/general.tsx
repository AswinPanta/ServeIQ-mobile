import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { GeneralSection } from '@/components/host/settings/GeneralSection';

export default function SettingsGeneralRoute() {
  return (
    <PropertySectionScreen title="General Settings" icon="settings-outline">
      {(property) => <GeneralSection property={property} />}
    </PropertySectionScreen>
  );
}