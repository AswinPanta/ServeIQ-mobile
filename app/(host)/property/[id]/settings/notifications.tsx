import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { NotificationsSection } from '@/components/host/settings/NotificationsSection';

export default function SettingsNotificationsRoute() {
  return (
    <PropertySectionScreen title="Notification Settings" icon="notifications-outline">
      {() => <NotificationsSection />}
    </PropertySectionScreen>
  );
}