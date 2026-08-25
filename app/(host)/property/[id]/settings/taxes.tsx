import React from 'react';
import { PropertySectionScreen } from '@/components/host/PropertySectionScreen';
import { TaxesSection } from '@/components/host/settings/TaxesSection';

export default function SettingsTaxesRoute() {
  return (
    <PropertySectionScreen title="Taxes & Policies" icon="receipt-outline">
      {() => <TaxesSection />}
    </PropertySectionScreen>
  );
}