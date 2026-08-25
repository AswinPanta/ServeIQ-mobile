import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { RoomRateSection } from '@/components/host/settings/RoomRateSection';

export default function SettingsRoomRateRoute() {
  return (
    <PropertySectionScreen title="Room & Rate" icon="bed-outline">
      {() => <RoomRateSection />}
    </PropertySectionScreen>
  );
}