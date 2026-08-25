import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { PaymentsSection } from '@/components/host/settings/PaymentsSection';

export default function SettingsPaymentsRoute() {
  return (
    <PropertySectionScreen title="Payment Method & Policies" icon="card-outline">
      {() => <PaymentsSection />}
    </PropertySectionScreen>
  );
}