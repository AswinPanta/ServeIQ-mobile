import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { SupportSection } from '@/components/host/settings/SupportSection';

export default function SettingsSupportRoute() {
  return (
    <PropertySectionScreen title="Support Tickets" icon="help-circle-outline">
      {() => <SupportSection />}
    </PropertySectionScreen>
  );
}