import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { IntegrationsSection } from '@/components/host/settings/IntegrationsSection';

export default function SettingsIntegrationsRoute() {
  return (
    <PropertySectionScreen title="Integrations" icon="git-merge-outline">
      {() => <IntegrationsSection />}
    </PropertySectionScreen>
  );
}