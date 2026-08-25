import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { ActivityLogsSection } from '@/components/host/settings/ActivityLogsSection';

export default function SettingsLogsRoute() {
  return (
    <PropertySectionScreen title="Activity Logs" icon="document-text-outline">
      {() => <ActivityLogsSection />}
    </PropertySectionScreen>
  );
}